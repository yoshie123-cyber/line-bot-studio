// NO TOP-LEVEL IMPORTS for SDKs to prevent initialization crashes on Vercel
export const config = { api: { bodyParser: false } };

let cachedDb: any = null;

export default async function handler(req: any, res: any) {
    // 1. IMMEDIATE RESPONSE FOR DIAGNOSTICS (Zero dependencies)
    if (req.method === 'GET') {
        return res.status(200).send(`
            <div style="font-family: sans-serif; padding: 20px; line-height: 1.6;">
                <h1 style="color: #00b900;">Webhook Rescue Mode [Ver 2.1]</h1>
                <p>Status: <span style="background: #dfd; padding: 2px 6px;">ALIVE</span></p>
                <p>Service Account: ${process.env.FIREBASE_SERVICE_ACCOUNT ? '✅ Found' : '❌ Missing'}</p>
                <p>Time: ${new Date().toLocaleString('ja-JP')}</p>
                <p>Env: ${process.env.NODE_ENV || 'unknown'}</p>
                <hr>
                <p>If you see this, the serverless function is running. The crash happens during library loading.</p>
            </div>
        `);
    }

    try {
        // 2. DYNAMIC IMPORTS (Load only when needed)
        let lineSdk, firebaseApp, firebaseFirestore;
        try {
            lineSdk = await import('@line/bot-sdk');
            firebaseApp = await import('firebase-admin/app');
            firebaseFirestore = await import('firebase-admin/firestore');
        } catch (importErr: any) {
            console.error('[CRASH] Import Failed:', importErr.message);
            return res.status(200).send(`IMPORT_ERROR: ${importErr.message}. Check if package.json has these dependencies.`);
        }

        const { uid, bid } = req.query;
        if (!uid || !bid) return res.status(200).send('OK (Query missing)');

        // 3. FIREBASE INIT
        if (!cachedDb) {
            try {
                const apps = firebaseApp.getApps();
                let app;
                if (!apps.length) {
                    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
                        const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
                        app = firebaseApp.initializeApp({ credential: firebaseApp.cert(sa) });
                    } else {
                        app = firebaseApp.initializeApp({ projectId: 'linebot-66e62' });
                    }
                } else {
                    app = apps[0];
                }
                cachedDb = firebaseFirestore.getFirestore(app);
            } catch (fbErr: any) {
                console.error('[CRASH] Firebase Init:', fbErr.message);
                return res.status(200).send(`FIREBASE_CRASH: ${fbErr.message}`);
            }
        }

        // 4. READ BODY
        const rawBody = await new Promise<string>((resolve) => {
            let data = '';
            req.on('data', (chunk: any) => { data += chunk; });
            req.on('end', () => resolve(data));
        });

        if (!rawBody) return res.status(200).send('OK (Empty)');

        // 5. FETCH CONFIG
        const botDoc = await cachedDb.doc(`users/${uid}/bots/${bid}`).get();
        if (!botDoc.exists) return res.status(200).send('OK (DB Not Found)');

        const botData = botDoc.data() || {};
        const { lineConfig, geminiApiKey, aiConfig } = botData;
        const channelSecret = lineConfig?.channelSecret;
        const channelAccessToken = lineConfig?.channelAccessToken;

        if (!channelAccessToken || !channelSecret || !geminiApiKey) {
            return res.status(200).send('OK (Config Incomplete)');
        }

        // 6. PARSE & PROCESS
        let body;
        try { body = JSON.parse(rawBody); } catch (e) { return res.status(200).send('OK (JSON Error)'); }

        const events = body?.events || [];
        if (events.length === 0) return res.status(200).send('Verification Success');

        const signature = req.headers['x-line-signature'] as string;
        if (signature && !lineSdk.validateSignature(rawBody, channelSecret, signature)) {
            console.warn('[WARN] Signature mismatch');
        }

        const client = new lineSdk.Client({ channelAccessToken, channelSecret });

        const results = await Promise.all(events.map(async (event: any) => {
            if (event?.type !== 'message' || event?.message?.type !== 'text') return null;
            try {
                const responseText = await getGeminiResponse(geminiApiKey, aiConfig?.systemPrompt || "", event.message.text);
                return await client.replyMessage(event.replyToken, { type: 'text', text: responseText });
            } catch (err: any) {
                console.error('[EVENT_ERROR]', err.message);
                return await client.replyMessage(event.replyToken, { type: 'text', text: `[Error] ${err.message}` });
            }
        }));

        return res.status(200).json(results);

    } catch (fatal: any) {
        console.error('[FATAL]', fatal.message);
        return res.status(200).send(`FATAL_CRASH: ${fatal.message}`);
    }
}

async function getGeminiResponse(apiKey: string, systemPrompt: string, userMessage: string) {
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: `System: ${systemPrompt}\n\nUser: ${userMessage}` }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 800 }
        })
    });
    const data: any = await response.json();
    if (response.ok) return data?.candidates?.[0]?.content?.parts?.[0]?.text || "No AI reply";
    throw new Error(data?.error?.message || "Gemini API Failure");
}
