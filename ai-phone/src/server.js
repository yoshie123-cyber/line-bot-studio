import http from 'node:http';
import { WebSocketServer } from 'ws';
import { config } from './config.js';
import { handleRelayConnection, relayTokenFor } from './relaySession.js';
import { isValidSignature } from './twilioSignature.js';
import {
  connectRelayTwiml,
  emptyTwiml,
  errorTwiml,
  hangupTwiml,
  transferFailedTwiml,
  transferTwiml,
} from './twiml.js';

const baseUrlOf = (req) => {
  if (config.publicBaseUrl) return config.publicBaseUrl;
  const proto = req.headers['x-forwarded-proto']?.split(',')[0] || 'http';
  return `${proto}://${req.headers.host}`;
};

const readForm = (req) =>
  new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1e6) req.destroy();
    });
    req.on('end', () => resolve(Object.fromEntries(new URLSearchParams(body))));
    req.on('error', reject);
  });

const sendXml = (res, xml) => {
  res.writeHead(200, { 'Content-Type': 'text/xml; charset=utf-8' });
  res.end(xml);
};

const routes = {
  // 電話番号の「A call comes in」に設定する Webhook
  '/voice': (params, baseUrl) => {
    if (!params.CallSid) return errorTwiml();
    return connectRelayTwiml({ baseUrl, relayToken: relayTokenFor(params.CallSid) });
  },

  // ConversationRelay が終了したとき（AIが転送を決めた / 通話が切れた）
  '/connect-action': (params, baseUrl) => {
    let handoff = null;
    try {
      handoff = params.HandoffData ? JSON.parse(params.HandoffData) : null;
    } catch {
      handoff = null;
    }
    if (handoff?.reasonCode === 'live-agent-handoff' && config.transferPhoneNumber) {
      return transferTwiml({ baseUrl, callerId: params.To });
    }
    if (params.ErrorCode) console.warn(`[${params.CallSid}] ConversationRelay終了エラー`, params.ErrorCode, params.ErrorMessage);
    return hangupTwiml();
  },

  // 担当者への転送結果
  '/dial-result': (params) => {
    console.log(`[${params.CallSid}] 転送結果: ${params.DialCallStatus}`);
    return params.DialCallStatus === 'completed' ? hangupTwiml() : transferFailedTwiml();
  },
};

const server = http.createServer(async (req, res) => {
  const path = req.url.split('?')[0];

  if (req.method === 'GET' && path === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    return res.end('ok');
  }

  const handler = routes[path];
  if (!handler || req.method !== 'POST') {
    res.writeHead(404);
    return res.end();
  }

  try {
    const params = await readForm(req);
    const baseUrl = baseUrlOf(req);

    if (config.twilioAuthToken) {
      const signature = req.headers['x-twilio-signature'];
      if (!isValidSignature(config.twilioAuthToken, signature, baseUrl + req.url, params)) {
        console.warn(`署名検証に失敗: ${path}（PUBLIC_BASE_URL がTwilioに設定したURLと一致しているか確認）`);
        res.writeHead(403);
        return res.end();
      }
    }

    sendXml(res, handler(params, baseUrl));
  } catch (err) {
    console.error('Webhook処理エラー:', err);
    sendXml(res, path === '/voice' ? errorTwiml() : emptyTwiml());
  }
});

const wss = new WebSocketServer({ noServer: true });
server.on('upgrade', (req, socket, head) => {
  if (req.url.split('?')[0] !== '/relay') return socket.destroy();
  wss.handleUpgrade(req, socket, head, (ws) => handleRelayConnection(ws));
});

server.listen(config.port, () => {
  console.log(`AI電話受付サーバー起動: port ${config.port}`);
  if (!config.twilioAuthToken) console.warn('TWILIO_AUTH_TOKEN 未設定: Twilio署名を検証しません（開発用）');
  if (!process.env.OPENAI_API_KEY) console.warn('OPENAI_API_KEY が未設定です');
  if (!config.transferPhoneNumber) console.warn('TRANSFER_PHONE_NUMBER 未設定: 担当者への転送は無効です');
});
