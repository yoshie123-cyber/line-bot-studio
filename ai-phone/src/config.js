// 環境変数から設定を読み込む。値を変えるときは .env（本番はホスティング側の環境変数）を編集する。
const env = process.env;

// 空文字を「未設定」として扱う。未設定の項目はTwiMLに出力せず、Twilio側のデフォルトに任せる。
const optional = (value) => (value && value.trim() ? value.trim() : undefined);

export const config = {
  port: Number(env.PORT || 8080),

  // 例: https://ai-phone.onrender.com （末尾スラッシュなし）。未設定ならリクエストのHostから組み立てる。
  publicBaseUrl: optional(env.PUBLIC_BASE_URL)?.replace(/\/$/, ''),

  // Twilioからのリクエスト署名の検証に使う。本番では必ず設定する。
  twilioAuthToken: optional(env.TWILIO_AUTH_TOKEN),

  openaiModel: optional(env.OPENAI_MODEL) || 'gpt-4.1-mini',

  // 人間の担当者の電話番号（E.164形式 例: +819012345678）。未設定なら転送機能を無効にする。
  transferPhoneNumber: optional(env.TRANSFER_PHONE_NUMBER),

  companyName: optional(env.COMPANY_NAME) || '',
  // 営業時間・対応範囲など、AIに知っておいてほしい情報（自由記述）
  businessInfo: optional(env.BUSINESS_INFO) || '',

  welcomeGreeting:
    optional(env.WELCOME_GREETING) ||
    'お電話ありがとうございます。AI受付です。本日はどのようなお問い合わせでしょうか？',

  // ConversationRelay の音声設定。未設定ならTwilioの日本語デフォルトを使う。
  language: optional(env.RELAY_LANGUAGE) || 'ja-JP',
  ttsProvider: optional(env.TTS_PROVIDER), // Google / Amazon / ElevenLabs
  ttsVoice: optional(env.TTS_VOICE),
  transcriptionProvider: optional(env.STT_PROVIDER), // Google / Deepgram
  speechModel: optional(env.STT_SPEECH_MODEL),

  // 転送前のアナウンスに使う <Say> の声
  sayVoice: optional(env.SAY_VOICE) || 'Polly.Kazuha-Neural',
};
