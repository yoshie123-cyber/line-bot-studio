// NO TOP-LEVEL IMPORTS for SDKs to prevent initialization crashes on Vercel
export const config = { api: { bodyParser: false } };

let cachedDb: any = null;

export default async function handler(req: any, res: any): Promise<void> {
    // 1. DIAGNOSTICS
    if (req.method === 'GET') {
        let botStatus = "Providing uid/bid in URL will test DB connection.";
        const { uid, bid } = req.query;

        try {
            if (uid && bid) {
                // Initialize Firebase briefly for diagnostic
                const lineSdk = await import('@line/bot-sdk');
                const firebaseApp = await import('firebase-admin/app');
                const firebaseFirestore = await import('firebase-admin/firestore');

                const apps = firebaseApp.getApps();
                let app = apps.length ? apps[0] : null;
                if (!app) {
                    const saEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
                    let sa = null;
                    if (saEnv) {
                        try {
                            sa = JSON.parse(saEnv);
                        } catch (e) {
                            console.warn('[Webhook] FIREBASE_SERVICE_ACCOUNT is not valid JSON, using as fallback project ID');
                        }
                    }

                    if (sa && typeof sa === 'object') {
                        app = firebaseApp.initializeApp({ credential: firebaseApp.cert(sa) });
                    } else {
                        // Fallback to project ID (might use ADC or fail if not found)
                        const pid = (typeof sa === 'string' ? sa : saEnv) || 'linebot-66e62';
                        app = firebaseApp.initializeApp({ projectId: pid });
                    }
                }
                const db = firebaseFirestore.getFirestore(app);
                const botDoc = await db.doc(`users/${uid}/bots/${bid}`).get();

                if (botDoc.exists) {
                    const data = botDoc.data() || {};
                    const hasLine = !!(data.lineConfig?.channelAccessToken && data.lineConfig?.channelSecret);
                    const hasGemini = !!data.geminiApiKey;

                    let modelList = "<i>Click test to fetch models...</i>";
                    if (hasGemini) {
                        try {
                            const mRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${data.geminiApiKey.trim()}`);
                            const mData: any = await mRes.json();
                            if (mRes.ok) {
                                const names = mData.models?.map((m: any) => m.name.replace('models/', '')) || [];
                                modelList = names.length > 0 ? names.join(', ') : "No models found";
                            } else {
                                modelList = `<span style="color:red;">Error: ${mData.error?.message || 'Unauthorized'}</span>`;
                            }
                        } catch (e: any) {
                            modelList = `Fetch failed: ${e.message}`;
                        }
                    }

                    botStatus = `
                        <div style="background: #fff; border: 1px solid #ddd; padding: 15px; border-radius: 8px; margin-top: 10px;">
                            <h3 style="margin-top:0;">Bot: ${data.name || 'Unnamed'}</h3>
                            <p>Database: ✅ Connected</p>
                            <p>LINE Config: ${hasLine ? '✅ Valid' : '❌ Incomplete'}</p>
                            <p>Gemini API: ${hasGemini ? '✅ Set' : '❌ Missing'}</p>
                            <div style="font-size: 11px; color: #555; background: #eee; padding: 10px; border-radius: 4px; border: 1px solid #ccc; max-height: 100px; overflow-y: auto;">
                                <b>Available Models:</b><br>${modelList}
                            </div>
                        </div>
                    `;
                } else {
                    botStatus = `<p style="color: red;">Bot Not Found (Check your URL IDs)</p>`;
                }
            }
        } catch (e: any) {
            botStatus = `<p style="color: red;">Diagnostic Error: ${e.message}</p>`;
        }

        return res.status(200).send(`
            <div style="font-family: sans-serif; padding: 20px; line-height: 1.6; background: #fafafa; min-height: 100vh;">
                <h1 style="color: #00b900;">Webhook Diagnostic [Ver 2.8]</h1>
                <p>Function Status: <span style="background: #dfd; padding: 2px 6px; border-radius: 4px;">ALIVE</span></p>
                <p>Service Account: ${process.env.FIREBASE_SERVICE_ACCOUNT ? (process.env.FIREBASE_SERVICE_ACCOUNT.trim().startsWith('{') ? '✅ Found (JSON)' : '⚠️ Found (Text only)') : '❌ Missing'}</p>
                <hr>
                ${botStatus}
                <p style="font-size: 12px; color: #666; margin-top: 20px;">Time: ${new Date().toLocaleString('ja-JP')}</p>
            </div>
        `);
    }

    try {
        // 2. DYNAMIC IMPORTS
        let lineSdk, firebaseApp, firebaseFirestore;
        try {
            lineSdk = await import('@line/bot-sdk');
            firebaseApp = await import('firebase-admin/app');
            firebaseFirestore = await import('firebase-admin/firestore');
        } catch (importErr: any) {
            console.error('[FATAL] Import:', importErr.message);
            return res.status(200).send(`IMPORT_ERR: ${importErr.message}`);
        }

        const { uid, bid } = req.query;
        if (!uid || !bid) return res.status(200).send('OK (Query missing)');

        // 3. FIREBASE INIT
        if (!cachedDb) {
            const apps = firebaseApp.getApps();
            let app;
            if (!apps.length) {
                const saEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
                let sa = null;
                if (saEnv) {
                    try { sa = JSON.parse(saEnv); } catch (e) { }
                }

                if (sa && typeof sa === 'object') {
                    app = firebaseApp.initializeApp({ credential: firebaseApp.cert(sa) });
                } else {
                    const pid = (typeof sa === 'string' ? sa : saEnv) || 'linebot-66e62';
                    app = firebaseApp.initializeApp({ projectId: pid });
                }
            } else {
                app = apps[0];
            }
            cachedDb = firebaseFirestore.getFirestore(app);
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
        if (!botDoc.exists) {
            console.error('[DB] Bot not found:', bid);
            return res.status(200).send('OK (Bot Not Found)');
        }

        const botData = botDoc.data() || {};
        const { lineConfig, geminiApiKey, aiConfig } = botData;
        const channelSecret = lineConfig?.channelSecret;
        const channelAccessToken = lineConfig?.channelAccessToken;

        if (!channelAccessToken || !channelSecret || !geminiApiKey) {
            console.warn('[DB] Config Incomplete for bot:', bid);
            return res.status(200).send('OK (Config Incomplete)');
        }

        // 6. PROCESS
        let body;
        try { body = JSON.parse(rawBody); } catch (e) { return res.status(200).send('OK (JSON Err)'); }

        const events = body?.events || [];
        console.log(`[Webhook] Event count: ${events.length} for bot: ${botData.name}`);

        if (events.length === 0) return res.status(200).send('Verification Success');

        const signature = req.headers['x-line-signature'] as string;
        const client = new lineSdk.Client({ channelAccessToken, channelSecret });

        const results = await Promise.all(events.map(async (event: any) => {
            if (event?.type !== 'message' || event?.message?.type !== 'text') return null;
            console.log(`[Message] From ${event.source?.userId}: ${event.message.text}`);

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
    const cleanKey = apiKey.trim();
    // Use models confirmed available in diagnostic:
    const models = ['gemini-2.0-flash', 'gemini-flash-latest', 'gemini-1.5-flash-latest', 'gemini-pro-latest'];
    let lastError = '';

    for (const model of models) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cleanKey}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: `System: ${systemPrompt}\n\nUser: ${userMessage}` }] }],
                    generationConfig: { temperature: 0.7, maxOutputTokens: 800 }
                })
            });
            const data: any = await response.json();
            if (response.ok) {
                return data?.candidates?.[0]?.content?.parts?.[0]?.text || "No AI reply";
            }
            lastError = data?.error?.message || "Unknown error";
            console.warn(`[Gemini] ${model} failed: ${lastError}`);
        } catch (e: any) {
            lastError = e.message;
        }
    }
    throw new Error(`All models failed. Last error: ${lastError}`);
}
