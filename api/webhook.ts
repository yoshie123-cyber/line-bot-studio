import { VercelRequest, VercelResponse } from '@vercel/node';
import isBot from 'isbot';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method === 'GET') {
        return res.status(200).send('LINE Bot Studio Webhook is active.');
    }

    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    const events = req.body.events;

    if (!events || events.length === 0) {
        return res.status(200).send('OK');
    }

    for (const event of events) {
        if (event.type === 'message' && event.message.type === 'text') {
            const replyToken = event.replyToken;
            const userMessage = event.message.text;

            // In a real implementation:
            // 1. Fetch bot config from DB based on some ID in URL or body
            // 2. Call OpenAI API with the system prompt
            // 3. Send reply back to LINE

            console.log('Received message:', userMessage);

            // Mock echo reply for now (until API keys are set up)
            try {
                await replyToLine(replyToken, `「${userMessage}」とおっしゃいましたね。API連携を設定するとAIが回答します。`);
            } catch (err) {
                console.error('Error replying to LINE:', err);
            }
        }
    }

    return res.status(200).send('OK');
}

async function replyToLine(replyToken: string, text: string) {
    const LINE_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!LINE_ACCESS_TOKEN) return;

    await fetch('https://api.line.me/v2/bot/message/reply', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`
        },
        body: JSON.stringify({
            replyToken: replyToken,
            messages: [{ type: 'text', text: text }]
        })
    });
}
