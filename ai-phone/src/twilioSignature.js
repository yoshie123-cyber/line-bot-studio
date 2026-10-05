import crypto from 'node:crypto';

// Twilioのリクエスト署名（X-Twilio-Signature）を計算する。
// 仕様: URL の後ろに、POSTパラメータを キー名順に「キー+値」で連結し、Auth Token で HMAC-SHA1 → Base64。
export function computeSignature(authToken, url, params = {}) {
  const data = Object.keys(params)
    .sort()
    .reduce((acc, key) => acc + key + params[key], url);
  return crypto.createHmac('sha1', authToken).update(Buffer.from(data, 'utf-8')).digest('base64');
}

export function isValidSignature(authToken, signature, url, params) {
  if (!signature) return false;
  return safeEqual(computeSignature(authToken, url, params), signature);
}

export function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}
