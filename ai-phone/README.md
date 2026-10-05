# AI電話受付（Twilio ConversationRelay + OpenAI）

電話をかけると日本語でAIが応答し、内容を聞き取り、必要に応じて人間の担当者へ転送するサーバーです。

```
着信 → Twilio → POST /voice（このサーバー）
      → TwiML <Connect><ConversationRelay language="ja-JP">
      → Twilio が音声認識(STT)・音声合成(TTS)・割り込み検知を担当
      ⇄ WebSocket /relay（このサーバー）⇄ OpenAI（文章の生成）
転送時 → AI が end を送信 → POST /connect-action → <Dial> で担当者へ
```

## この構成を選んだ理由

| 観点 | ConversationRelay（採用） | OpenAI Realtime API を Media Streams で直結 |
|---|---|---|
| 日本語の音声認識・合成 | Twilio が Google / Amazon / ElevenLabs / Deepgram を提供。声の差し替えは設定だけで済む | OpenAI の音声のみ。日本語の声の選択肢が少ない |
| 割り込み | Twilio が検知して `interrupt` を送ってくる | 自前で音声バッファを管理する必要がある |
| 転送 | `end` を送り、TwiML の `<Dial>` を返すだけ | REST API で通話を更新する処理が別途必要 |
| 安定性・保守 | サーバーは文字のやり取りだけなので小さい | 音声フォーマット変換やタイミング調整が必要 |
| 応答速度 | 音声→文字→AI→音声の分だけわずかに遅い | 最速 |

応答速度は Realtime 直結がやや有利です。ただし日本語の声の質、割り込み、転送のしやすさ、保守性を総合して ConversationRelay を採用しました。

## ファイル

| ファイル | 役割 |
|---|---|
| `src/server.js` | HTTP（Twilio Webhook）と WebSocket の受け口 |
| `src/twiml.js` | Twilio に返す TwiML（ConversationRelay / 転送 / 案内） |
| `src/relaySession.js` | 1通話分の会話管理（割り込み、転送、会話ログ） |
| `src/llm.js` | OpenAI への問い合わせと、AIへの指示（システムプロンプト） |
| `src/twilioSignature.js` | Twilio からのリクエストかを検証 |
| `.env.example` | 設定項目の一覧 |

## 公開手順（Render の場合）

1. Render で「New → Blueprint」を選び、このリポジトリを指定します（ルートの `render.yaml` を読み込みます）。
2. 環境変数 `OPENAI_API_KEY`、`TWILIO_AUTH_TOKEN`、`TRANSFER_PHONE_NUMBER` などを入力します。
3. デプロイ後に表示される URL（例: `https://ai-phone.onrender.com`）を `PUBLIC_BASE_URL` に設定し、再デプロイします。
4. `https://…/health` が `ok` を返すことを確認します。

WebSocket を常時受けられるホスティングが必要です。Vercel のサーバーレス関数は使えません。Fly.io、Railway、Cloud Run（最小インスタンス1）などでも動きます。

## Twilio Console の設定

1. **Phone Numbers → Manage → Active numbers** で対象の番号を開きます。
2. **Voice Configuration** を次のように設定します。
   - A call comes in: **Webhook** / `https://<PUBLIC_BASE_URL>/voice` / **HTTP POST**
3. **Save configuration** を押します。

`PUBLIC_BASE_URL` は、Twilio に登録した URL と一字一句同じにしてください。違うと署名の検証に失敗し、通話がつながりません（ログに「署名検証に失敗」と出ます）。

## よく変える場所

| 変えたいこと | 場所 |
|---|---|
| 最初の挨拶 | 環境変数 `WELCOME_GREETING` |
| 会社名・営業時間・対応範囲 | 環境変数 `COMPANY_NAME`、`BUSINESS_INFO` |
| AIの話し方・聞き取る項目・転送の条件 | `src/llm.js` の `buildSystemPrompt` |
| 声 | 環境変数 `TTS_PROVIDER`、`TTS_VOICE` |
| 転送先 | 環境変数 `TRANSFER_PHONE_NUMBER` |
| 転送時の案内文 | `src/twiml.js` |

通話中にプッシュボタンの「0」を押しても、担当者へ転送されます。

## 会話ログ（文字起こし）

通話が終わると、サーバーのログに会話全文が出力されます（`src/relaySession.js` の `close` 処理）。保存が必要な場合は、ここからスプレッドシートやデータベースに書き込む処理を追加します。

## Trial アカウントの制約

- 着信の冒頭に英語の Trial メッセージが流れます。消すには有料アカウントへのアップグレードが必要です。
- 発信や転送は、Verified Caller IDs に登録した番号に対してしかできません。

## ローカルで動かす

```bash
cp .env.example .env   # 値を入力
npm install
npm run dev
```

Twilio から接続できるように、ngrok などで公開 URL を作り、その URL を `PUBLIC_BASE_URL` に設定してください。
