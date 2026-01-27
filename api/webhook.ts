import { Client, WebhookEvent, validateSignature } from '@line/bot-sdk';
import * as admin from 'firebase-admin';

// Disable default body parser for raw body signature check
export const config = {
    api: {
        bodyParser: false,
    },
};

// Helper for raw body reading (essential for Vercel functions)
async function getRawBody(req: any): Promise<string> {
    if (req.body && typeof req.body === 'string') return req.body;
    if (req.body && typeof req.body === 'object') return JSON.stringify(req.body);

    const chunks = [];
    for await (const chunk of req) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks).toString('utf8');
}

// Global initialization function to avoid top-level crash
function initFirebase() {
    if (!admin.apps.length) {
        try {
            if (process.env.FIREBASE_SERVICE_ACCOUNT) {
                const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount)
                });
                console.log("[Webhook Init] Successful with Service Account.");
            } else {
                admin.initializeApp({ projectId: 'linebot-66e62' });
                console.warn("[Webhook Init] No Service Account. Using fallback.");
            }
        } catch (e: any) {
            console.error("[Webhook Init] CRITICAL FAILURE:", e.message);
            // Even if init fails, we define a stub to avoid reference errors
            if (!admin.apps.length) admin.initializeApp({ projectId: 'linebot-66e62' });
        }
    }
    return admin.firestore();
}

export default async function handler(req: any, res: any) {
    // 1. Diagnostics (GET support)
    if (req.method === 'GET') {
        return res.status(200).send(`
            <h1>Webhook Status: ONLINE</h1>
            <p>Database: ${admin.apps.length ? 'Initialized' : 'Not Ready'}</p>
            <p>Auth Status: ${process.env.FIREBASE_SERVICE_ACCOUNT ? 'Key Found' : 'Key Missing'}</p>
            <p>Time: ${new Date().toISOString()}</p>
        `);
    }

    if (req.method !== 'POST') {
        return res.status(405).send('Only POST allowed');
    }

    const { uid, bid } = req.query;
    if (!uid || !bid) {
        return res.status(200).send('OK (Parameters uid/bid missing)');
    }

    try {
        const db = initFirebase();
        const rawBody = await getRawBody(req);

        // 2. Fetch Bot Settings
        let botDoc;
        try {
            botDoc = await db.doc(`users/${uid}/bots/${bid}`).get();
        } catch (dbErr: any) {
            console.error('[Webhook DB Error]', dbErr.message);
            // Return 200 with debug info so it doesn't break LINE integration entirely
            return res.status(200).send(`DB_ERROR: ${dbErr.message}`);
        }

        if (!botDoc.exists) {
            return res.status(200).send('OK (Bot config not found)');
        }

        const botData = botDoc.data() as any;
        const { lineConfig, geminiApiKey } = botData;

        // 3. Signature & Probe Check
        const bodyParsed = JSON.parse(rawBody);

        // Handle Verification Probe
        if (!bodyParsed.events || bodyParsed.events.length === 0) {
            return res.status(200).send('Verification Success');
        }

        if (!lineConfig?.channelAccessToken || !lineConfig?.channelSecret || !geminiApiKey) {
            return res.status(200).send('OK (Config incomplete)');
        }

        const signature = req.headers['x-line-signature'] as string;
        if (signature && !validateSignature(rawBody, lineConfig.channelSecret, signature)) {
            console.warn('[Webhook] Signature validation failed.');
        }

        const client = new Client({
            channelAccessToken: lineConfig.channelAccessToken,
            channelSecret: lineConfig.channelSecret,
        });

        // 4. Process
        const results = await Promise.all(
            bodyParsed.events.map((event: WebhookEvent) => handleEvent(client, event, botData))
        );

        return res.status(200).json(results);

    } catch (error: any) {
        console.error('[Webhook Fatal]', error);
        // We cannot reply to the user here because we might not have a replyToken
        return res.status(200).send(`FATAL_ERROR: ${error.message}`);
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
        if (!geminiApiKey) throw new Error("Gemini APIキーが設定されていません。ボット編集画面を確認してください。");

        const aiResponse = await getGeminiResponse(geminiApiKey, systemPrompt, userMessage);
        return await client.replyMessage(event.replyToken, { type: 'text', text: aiResponse });
    } catch (e: any) {
        console.error('[Webhook AI Error]', e.message);
        // Send the ACTUAL error message to the LINE chat for debugging
        return await client.replyMessage(event.replyToken, {
            type: 'text',
            text: `[システムエラー]\n内容: ${e.message}\n\n※このメッセージはシステム管理者向けの診断情報です。`
        });
    }
}

async function getGeminiResponse(apiKey: string, systemPrompt: string, userMessage: string) {
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: `System Setting: ${systemPrompt}\n\nUser Message: ${userMessage}` }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 800 }
        })
    });
    const data: any = await response.json();
    if (response.ok) return data.candidates?.[0]?.content?.parts?.[0]?.text || "No AI reply";
    throw new Error(data.error?.message || "API Failure");
}
