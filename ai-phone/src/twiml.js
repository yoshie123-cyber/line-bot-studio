import { config } from './config.js';

const escapeXml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const attrs = (obj) =>
  Object.entries(obj)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${key}="${escapeXml(value)}"`)
    .join(' ');

const response = (body) => `<?xml version="1.0" encoding="UTF-8"?>\n<Response>${body}</Response>`;

// 着信時: ConversationRelay で WebSocket サーバーに接続する。
// 通話が ConversationRelay から戻ってきたら（転送・終了）、action の URL が呼ばれる。
export function connectRelayTwiml({ baseUrl, relayToken }) {
  const wsUrl = baseUrl.replace(/^http/, 'ws') + '/relay';
  const relay = attrs({
    url: wsUrl,
    welcomeGreeting: config.welcomeGreeting,
    language: config.language,
    ttsProvider: config.ttsProvider,
    voice: config.ttsVoice,
    transcriptionProvider: config.transcriptionProvider,
    speechModel: config.speechModel,
    interruptible: 'any',
    dtmfDetection: 'true',
  });
  return response(
    `<Connect action="${escapeXml(baseUrl + '/connect-action')}">` +
      `<ConversationRelay ${relay}>` +
      `<Parameter name="relayToken" value="${escapeXml(relayToken)}"/>` +
      `</ConversationRelay>` +
      `</Connect>`,
  );
}

const say = (text) =>
  `<Say ${attrs({ language: config.language, voice: config.sayVoice })}>${escapeXml(text)}</Say>`;

// AIが「担当者へ転送」と判断したとき
export function transferTwiml({ baseUrl, callerId }) {
  return response(
    say('担当者におつなぎします。少々お待ちください。') +
      `<Dial ${attrs({ callerId, timeout: 25, action: baseUrl + '/dial-result' })}>` +
      escapeXml(config.transferPhoneNumber) +
      `</Dial>`,
  );
}

export function transferFailedTwiml() {
  return response(
    say('申し訳ございません。ただいま担当者が電話に出ることができません。お手数ですが、時間をおいておかけ直しください。') +
      '<Hangup/>',
  );
}

export function errorTwiml() {
  return response(say('申し訳ございません。ただいまシステムが混み合っております。時間をおいておかけ直しください。') + '<Hangup/>');
}

export const hangupTwiml = () => response('<Hangup/>');
export const emptyTwiml = () => response('');
