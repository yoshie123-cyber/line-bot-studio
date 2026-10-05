import OpenAI from 'openai';
import { config } from './config.js';

let client;
const getClient = () => (client ??= new OpenAI()); // OPENAI_API_KEY を環境変数から読む

export const transferEnabled = () => Boolean(config.transferPhoneNumber);

export function buildSystemPrompt() {
  const company = config.companyName ? `「${config.companyName}」の` : '';
  const transferRule = transferEnabled()
    ? `- 次の場合は transfer_to_human ツールを呼び、人間の担当者に転送する。転送前の案内はシステムが流すので、ツールを呼ぶときに自分では何も話さない。
  - 相手が担当者・人間との会話を希望したとき
  - 漏水・火災・鍵の閉じ込めなど、緊急の対応が必要なとき
  - 契約内容・金額の確定など、あなたが判断できない内容を相手が求めたとき`
    : `- 担当者への転送はできない。判断できない内容は、お名前・ご連絡先・ご用件を伺い、担当者から折り返すと伝える。`;

  return `あなたは${company}電話受付を担当するAIです。電話口で、日本語で丁寧かつ自然に会話してください。

# 話し方
- 1回の返答は1〜2文、長くても60文字程度に収める。電話なので短く区切る。
- 箇条書き・記号・絵文字・URL・括弧書き・マークダウンは使わない。読み上げてそのまま自然な文にする。
- 敬語（です・ます調）で、相手の言葉を短く受け止めてから質問する。例：「承知しました。物件についてのお問い合わせですね。」
- 確認したいことは一度に一つずつ聞く。
- 音声認識の誤りがありうる。聞き取れない・意味が通らないときは推測せず、やさしく聞き返す。

# 受付の進め方
- まずご用件を伺う。必要に応じて、お名前、ご連絡先の電話番号、物件名またはご住所、ご用件の詳細を順に確認する。
- 事実が分からないことは答えをつくらない。「担当者に確認のうえご連絡いたします」と伝える。
${transferRule}
- 用件を伺い終えたら、内容を短く復唱し、お礼を伝える。

${config.businessInfo ? `# 会社・業務の情報\n${config.businessInfo}\n` : ''}`;
}

const tools = [
  {
    type: 'function',
    function: {
      name: 'transfer_to_human',
      description: '通話を人間の担当者に転送する。',
      parameters: {
        type: 'object',
        properties: {
          reason: { type: 'string', description: '転送理由と、ここまでに伺った用件の要約（日本語）' },
        },
        required: ['reason'],
      },
    },
  },
];

// 返答をトークン単位で流す。{ type: 'text', text } と { type: 'tool', name, args } を順に返す。
export async function* streamReply(messages, signal) {
  const stream = await getClient().chat.completions.create(
    {
      model: config.openaiModel,
      messages,
      stream: true,
      temperature: 0.4,
      ...(transferEnabled() ? { tools } : {}),
    },
    { signal },
  );

  const toolCalls = [];
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta;
    if (!delta) continue;
    if (delta.content) yield { type: 'text', text: delta.content };
    for (const call of delta.tool_calls ?? []) {
      const slot = (toolCalls[call.index] ??= { name: '', args: '' });
      if (call.function?.name) slot.name += call.function.name;
      if (call.function?.arguments) slot.args += call.function.arguments;
    }
  }

  for (const call of toolCalls) {
    let args = {};
    try {
      args = JSON.parse(call.args || '{}');
    } catch {
      // 引数が壊れていても転送自体は行う
    }
    yield { type: 'tool', name: call.name, args };
  }
}
