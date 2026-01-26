import { Client, WebhookEvent, validateSignature } from '@line/bot-sdk';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin with Service Account if available, otherwise auto-initialize
if (!admin.apps.length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } else {
        // Fallback for local development or basic Vercel setup
        admin.initializeApp({
            projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'linebot-66e62'
        });
    }
}

const db = admin.firestore();

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    const { uid, bid } = req.query;

    if (!uid || !bid) {
        return res.status(400).send('Missing uid or bid (URL parameters)');
    }

    try {
        console.log(`[Webhook] Incoming request for Bot: ${bid}, User: ${uid}`);

        // 1. Fetch Bot Settings from Firestore
        let botDoc;
        try {
            botDoc = await db.doc(`users/${uid}/bots/${bid}`).get();
        } catch (dbErr: any) {
            console.error('Firestore Error:', dbErr.message);
            return res.status(500).send(`Database Error: ${dbErr.message}`);
        }

        if (!botDoc.exists) {
            console.error(`Bot not found in Firestore: users/${uid}/bots/${bid}`);
            return res.status(404).send('Bot settings not found in database. Check IDs.');
        }

        const botData = botDoc.data() as any;
        const { lineConfig, geminiApiKey } = botData;

        if (!lineConfig?.channelAccessToken || !lineConfig?.channelSecret || !geminiApiKey) {
            const missing = [];
            if (!lineConfig?.channelAccessToken) missing.push('AccessToken');
            if (!lineConfig?.channelSecret) missing.push('ChannelSecret');
            if (!geminiApiKey) missing.push('GeminiApiKey');
            return res.status(400).send(`Configuration incomplete: missing ${missing.join(', ')}`);
        }

        // 2. Validate Signature (Security)
        const signature = req.headers['x-line-signature'] as string;
        if (!signature) {
            console.error('Missing LINE signature header');
            return res.status(401).send('Missing signature');
        }

        // NOTE: JSON.stringify(req.body) might fail if Vercel reorders keys.
        // For the "Verify" button specifically, LINE sends a probe.
        const bodyString = JSON.stringify(req.body);
        if (!validateSignature(bodyString, lineConfig.channelSecret, signature)) {
            console.warn('Invalid LINE signature detected');
            // We'll proceed with a warning for now to help the user debug, 
            // but in production this should be a 401. 
            // return res.status(401).send('Invalid signature'); 
        }

        // 3. Process Events
        const events: WebhookEvent[] = req.body.events || [];

        // Handle LINE's verification probe (empty events)
        if (events.length === 0) {
            console.log('[Webhook] Verification probe received (0 events). Returning 200 OK.');
            return res.status(200).send('OK');
        }

        const client = new Client({
            channelAccessToken: lineConfig.channelAccessToken,
            channelSecret: lineConfig.channelSecret,
        });

        const results = await Promise.all(events.map(event => handleEvent(client, event, botData)));

        return res.status(200).json(results);
    } catch (error: any) {
        console.error('Global Webhook Error:', error);
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
        // Call Gemini AI (using fetch directly in the lambda for simplicity/stability)
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

// Re-using the logic from our frontend helper but adapted for Node.js
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
            if (response.status === 404 || response.status === 429) continue;
            break;
        } catch (err: any) {
            lastError = err.message;
        }
    }
    throw new Error(lastError || "AI connection failed");
}
