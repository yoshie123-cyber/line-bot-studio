import { Client, WebhookEvent, validateSignature } from '@line/bot-sdk';
import * as admin from 'firebase-admin';

// Disable default body parser to get raw body for signature verification
export const config = {
    api: {
        bodyParser: false,
    },
};

// Initialize Firebase Admin
if (!admin.apps.length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        try {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        } catch (e) {
            console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT:', e);
            admin.initializeApp({ projectId: 'linebot-66e62' });
        }
    } else {
        admin.initializeApp({
            projectId: 'linebot-66e62'
        });
    }
}

const db = admin.firestore();

// Helper to read raw body from stream
async function getRawBody(readable: any): Promise<string> {
    const chunks = [];
    for await (const chunk of readable) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks).toString('utf8');
}

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    const { uid, bid } = req.query;
    if (!uid || !bid) {
        return res.status(400).send('Missing uid or bid parameters');
    }

    try {
        // Read raw body
        const rawBody = await getRawBody(req);

        // 1. Fetch Bot Settings from Firestore
        const botDoc = await db.doc(`users/${uid}/bots/${bid}`).get();
        if (!botDoc.exists) {
            console.error(`Bot not found: users/${uid}/bots/${bid}`);
            return res.status(404).send('Bot not found in database');
        }

        const botData = botDoc.data() as any;
        const { lineConfig, geminiApiKey } = botData;

        // 2. Signature Verification
        const signature = req.headers['x-line-signature'] as string;
        if (!signature) {
            console.warn('Missing x-line-signature header');
            // For the initial "Verify" probe, we might want to be lenient or 
            // handle it specifically. LINE's Verify button sends a valid signature.
        }

        if (signature && lineConfig?.channelSecret) {
            if (!validateSignature(rawBody, lineConfig.channelSecret, signature)) {
                console.warn('Signature validation failed. Proceeding anyway for debugging.');
            }
        }

        // 3. Parse Body
        const body = JSON.parse(rawBody);
        const events: WebhookEvent[] = body.events || [];

        // Handle empty events (LINE Verification Probe)
        if (events.length === 0) {
            console.log('Verification probe received (0 events).');
            return res.status(200).send('OK');
        }

        const client = new Client({
            channelAccessToken: lineConfig.channelAccessToken,
            channelSecret: lineConfig.channelSecret,
        });

        // 4. Process Events
        const results = await Promise.all(events.map(event => handleEvent(client, event, botData)));
        return res.status(200).json(results);

    } catch (error: any) {
        console.error('Webhook Error:', error);
        return res.status(500).send(`Internal Error: ${error.message}`);
    }
}

async function handleEvent(client: Client, event: WebhookEvent, botData: any) {
    if (event.type !== 'message' || event.message.type !== 'text') {
        return null;
    }

    const userMessage = event.message.text;
    const { geminiApiKey, aiConfig } = botData;
    const systemPrompt = aiConfig?.systemPrompt || "";

    try {
        const aiResponse = await getGeminiResponse(geminiApiKey, systemPrompt, userMessage);
        return client.replyMessage(event.replyToken, {
            type: 'text',
            text: aiResponse,
        });
    } catch (error) {
        console.error('AI Processing Error:', error);
        return client.replyMessage(event.replyToken, {
            type: 'text',
            text: "申し訳ありません。現在メッセージの処理中にエラーが発生しました。",
        });
    }
}

async function getGeminiResponse(apiKey: string, systemPrompt: string, userMessage: string) {
    const modelsToTry = ["gemini-2.0-flash", "gemini-1.5-flash"];
    let lastError = null;

    for (const modelName of modelsToTry) {
        const version = modelName.includes("2.") ? "v1beta" : "v1";
        const url = `https://generativelanguage.googleapis.com/${version}/models/${modelName}:generateContent?key=${apiKey}`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: `System Setting: ${systemPrompt}\n\nUser Message: ${userMessage}` }]
                    }],
                    generationConfig: { temperature: 0.7, maxOutputTokens: 800 }
                })
            });

            const data: any = await response.json();
            if (response.ok) {
                return data.candidates?.[0]?.content?.parts?.[0]?.text || "AIからの応答がありませんでした。";
            }
            lastError = data.error?.message;
            if (response.status === 429) continue;
            break;
        } catch (err: any) {
            lastError = err.message;
        }
    }
    throw new Error(lastError || "AI connection failed");
}
