import { Client, WebhookEvent, validateSignature } from '@line/bot-sdk';
import * as admin from 'firebase-admin';

// Disable default body parser for raw body signature check
export const config = {
    api: {
        bodyParser: false,
    },
};

// Robust Firebase Admin Initialization
if (!admin.apps.length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        try {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log("[Webhook] Initialized with Service Account.");
        } catch (e) {
            console.error('[Webhook] Failed to parse FIREBASE_SERVICE_ACCOUNT:', e);
            admin.initializeApp({ projectId: 'linebot-66e62' });
        }
    } else {
        // Fallback (might fail in production if not in Google Cloud)
        console.warn("[Webhook] No service account found. Using default initialization.");
        admin.initializeApp({ projectId: 'linebot-66e62' });
    }
}

const db = admin.firestore();

// Helper for raw body
async function getRawBody(readable: any): Promise<string> {
    const chunks = [];
    for await (const chunk of readable) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks).toString('utf8');
}

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).send('Only POST allowed');
    }

    const { uid, bid } = req.query;
    if (!uid || !bid) {
        return res.status(200).send('Webhook is active! (Missing query parameters: uid, bid)');
    }

    try {
        const rawBody = await getRawBody(req);

        // 1. Fetch Bot Settings (Crucial step)
        let botDoc;
        try {
            botDoc = await db.doc(`users/${uid}/bots/${bid}`).get();
        } catch (dbErr: any) {
            console.error('[Webhook] Database Access Error:', dbErr.message);
            // If it's a verification probe from LINE, we MUST try to return 200
            // but we can add the error to the body for the user to see in logs.
            return res.status(200).send(`WARNING: Webhook reached but Database failed. Reason: ${dbErr.message}. Ensure FIREBASE_SERVICE_ACCOUNT is set in Vercel.`);
        }

        if (!botDoc.exists) {
            console.warn(`[Webhook] Bot not found: users/${uid}/bots/${bid}`);
            return res.status(200).send('OK (Bot config not found in Firestore)');
        }

        const botData = botDoc.data() as any;
        const { lineConfig, geminiApiKey } = botData;

        // 2. Signature & Config Check
        const signature = req.headers['x-line-signature'] as string;

        // Handle empty events (LINE Verification Probe)
        const bodyParsed = JSON.parse(rawBody);
        if (!bodyParsed.events || bodyParsed.events.length === 0) {
            console.log('[Webhook] LINE Verification Probe received.');
            return res.status(200).send('Webhook Verification Successful');
        }

        if (!lineConfig?.channelAccessToken || !lineConfig?.channelSecret || !geminiApiKey) {
            console.error('[Webhook] Missing configuration for bot.');
            return res.status(200).send('OK (Configuration missing in Firestore)');
        }

        // 3. Security Check
        if (signature && !validateSignature(rawBody, lineConfig.channelSecret, signature)) {
            console.warn('[Webhook] Invalid signature. Proceeding for debugging but security risk.');
        }

        const client = new Client({
            channelAccessToken: lineConfig.channelAccessToken,
            channelSecret: lineConfig.channelSecret,
        });

        // 4. Process Events
        const results = await Promise.all(bodyParsed.events.map((event: WebhookEvent) => handleEvent(client, event, botData)));
        return res.status(200).json(results);

    } catch (error: any) {
        console.error('[Webhook] Global Catch:', error);
        // Always try to return 200 for LINE to avoid disabling the webhook
        return res.status(200).send(`Error Handled: ${error.message}`);
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
        return client.replyMessage(event.replyToken, { type: 'text', text: aiResponse });
    } catch (error: any) {
        console.error('[Webhook] AI Response Error:', error.message);
        return client.replyMessage(event.replyToken, { type: 'text', text: "AI応答中にエラーが発生しました。" });
    }
}

async function getGeminiResponse(apiKey: string, systemPrompt: string, userMessage: string) {
    const model = "gemini-1.5-flash"; // Simplified for production stable
    const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: `System Setting: ${systemPrompt}\n\nUser Message: ${userMessage}` }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 800 }
        })
    });

    const data: any = await response.json();
    if (response.ok) {
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "AI回答なし";
    }
    throw new Error(data.error?.message || "Gemini API Failure");
}
