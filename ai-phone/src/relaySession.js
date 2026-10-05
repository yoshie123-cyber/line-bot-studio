import crypto from 'node:crypto';
import { config } from './config.js';
import { buildSystemPrompt, streamReply, transferEnabled } from './llm.js';
import { safeEqual } from './twilioSignature.js';

const FALLBACK_REPLY = '申し訳ございません。うまく聞き取れませんでした。もう一度おっしゃっていただけますか。';

// /voice で発行し、WebSocket の setup で照合する通話ごとのトークン。
// Twilio以外からの WebSocket 接続で OpenAI を勝手に使われるのを防ぐ。
const tokenSecret = config.twilioAuthToken || crypto.randomBytes(32).toString('hex');
export const relayTokenFor = (callSid) =>
  crypto.createHmac('sha256', tokenSecret).update(String(callSid)).digest('hex');

const maskNumber = (number) => (number ? String(number).replace(/\d(?=\d{4})/g, '*') : '');

export function handleRelayConnection(ws) {
  const messages = [
    { role: 'system', content: buildSystemPrompt() },
    { role: 'assistant', content: config.welcomeGreeting },
  ];
  let callSid = null;
  let authenticated = false;
  let current = null; // 生成中の返答 { controller, text }
  let ended = false;

  const send = (payload) => {
    if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(payload));
  };
  const log = (...args) => console.log(`[${callSid ?? 'no-call'}]`, ...args);

  const handoff = (reason) => {
    if (ended) return;
    ended = true;
    current?.controller.abort();
    log('担当者へ転送:', reason);
    send({ type: 'end', handoffData: JSON.stringify({ reasonCode: 'live-agent-handoff', reason }) });
  };

  async function respond() {
    current?.controller.abort();
    const turn = { controller: new AbortController(), text: '' };
    current = turn;
    let transferReason = null;

    try {
      for await (const event of streamReply(messages, turn.controller.signal)) {
        if (event.type === 'text') {
          turn.text += event.text;
          send({ type: 'text', token: event.text, last: false });
        } else if (event.type === 'tool' && event.name === 'transfer_to_human') {
          transferReason = event.args.reason || '担当者希望';
        }
      }
      if (turn.controller.signal.aborted) return;
      send({ type: 'text', token: '', last: true });
      if (turn.text) {
        messages.push({ role: 'assistant', content: turn.text });
        log('AI:', turn.text);
      }
      if (transferReason) handoff(transferReason);
    } catch (err) {
      if (turn.controller.signal.aborted) return;
      log('LLMエラー:', err.message);
      send({ type: 'text', token: FALLBACK_REPLY, last: true });
    } finally {
      if (current === turn) current = null;
    }
  }

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    if (msg.type === 'setup') {
      callSid = msg.callSid;
      const token = msg.customParameters?.relayToken;
      if (!callSid || !token || !safeEqual(token, relayTokenFor(callSid))) {
        console.warn('WebSocket認証に失敗したため切断します');
        ws.close(1008, 'unauthorized');
        return;
      }
      authenticated = true;
      log('通話開始 from', maskNumber(msg.from), 'to', msg.to);
      return;
    }
    if (!authenticated) {
      ws.close(1008, 'setup required');
      return;
    }

    switch (msg.type) {
      case 'prompt': {
        const text = (msg.voicePrompt || '').trim();
        if (!text || ended) return;
        log('相手:', text);
        messages.push({ role: 'user', content: text });
        respond();
        break;
      }
      case 'interrupt': {
        // 相手が話し始めたら、AIの返答は「実際に読み上げた所まで」として会話履歴に残す
        const spoken = msg.utteranceUntilInterrupt || '';
        if (current) {
          current.controller.abort();
          current = null;
          if (spoken) messages.push({ role: 'assistant', content: spoken });
        } else {
          const last = messages[messages.length - 1];
          if (last?.role === 'assistant' && spoken) last.content = spoken;
        }
        break;
      }
      case 'dtmf':
        if (msg.digit === '0' && transferEnabled()) handoff('プッシュボタン0で担当者を希望');
        break;
      case 'error':
        log('ConversationRelayエラー:', msg.description);
        break;
    }
  });

  ws.on('close', () => {
    current?.controller.abort();
    if (!authenticated) return;
    // 通話の文字起こし（会話ログ）。保存先が必要になったらここでDB等に書き込む。
    const transcript = messages
      .filter((m) => m.role !== 'system')
      .map((m) => `${m.role === 'user' ? '相手' : 'AI'}: ${m.content}`)
      .join('\n');
    log(`通話終了。会話ログ:\n${transcript}`);
  });
}
