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
                            const apiKey = data.geminiApiKey.trim();
                            const mRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
                            const mData: any = await mRes.json();
                            if (mRes.ok) {
                                const names = mData.models?.filter((m: any) => m.supportedGenerationMethods?.includes('generateContent')).map((m: any) => m.name.replace('models/', '')) || [];

                                if (names.length > 0) {
                                    const results = await Promise.all(names.slice(0, 5).map(async (name: string) => {
                                        try {
                                            const tRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${name}:generateContent?key=${apiKey}`, {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ contents: [{ parts: [{ text: 'Hi' }] }] })
                                            });
                                            const tData: any = await tRes.json();
                                            return `• <b>${name}</b>: ${tRes.status === 200 ? '✅ OK' : `❌ ${tRes.status} (${tData.error?.message || 'Error'})`}`;
                                        } catch (e: any) {
                                            return `• <b>${name}</b>: ❌ Fetch Failed (${e.message})`;
                                        }
                                    }));
                                    modelList = results.join('<br>');
                                } else {
                                    modelList = "No generation models found.";
                                }
                            } else {
                                modelList = `<span style="color:red;">API Error: ${mData.error?.message || 'Unauthorized'}</span>`;
                            }
                        } catch (e: any) {
                            modelList = `Diagnostic failed: ${e.message}`;
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
                <h1 style="color: #00b900;">Webhook Diagnostic [Ver 1.6.4]</h1>
                <p>Function Status: <span style="background: #dfd; padding: 2px 6px; border-radius: 4px;">ALIVE</span></p>
                <div style="background: #eef2ff; border: 1px solid #c7d2fe; padding: 12px; border-radius: 6px; margin: 15px 0;">
                    <b>Diagnostic URL:</b><br>
                    <code style="word-break: break-all; font-size: 11px;">https://${req.headers.host}/api/webhook?uid=${uid}&bid=${bid}</code>
                </div>
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
            if (event?.type !== 'message') return null;

            const message = event.message;
            let userPrompt = "";
            let mediaPart: any = null;

            if (message.type === 'text') {
                userPrompt = message.text;
                console.log(`[Message:Text] From ${event.source?.userId}: ${userPrompt}`);
            } else if (['image', 'audio', 'video', 'file'].includes(message.type)) {
                console.log(`[Message:${message.type}] From ${event.source?.userId}`);
                try {
                    // Download media as buffer
                    const stream = await client.getMessageContent(message.id);
                    const buffer = await new Promise<Buffer>((resolve, reject) => {
                        const chunks: any[] = [];
                        stream.on('data', (chunk) => chunks.push(chunk));
                        stream.on('error', reject);
                        stream.on('end', () => resolve(Buffer.concat(chunks)));
                    });

                    let mimeType = '';
                    if (message.type === 'image') mimeType = 'image/jpeg';
                    else if (message.type === 'audio') mimeType = 'audio/m4a'; // LINE audio usually m4a
                    else if (message.type === 'video') mimeType = 'video/mp4';
                    else if (message.type === 'file') {
                        // For files, we need to be more careful. PDF is common.
                        const ext = message.fileName?.toLowerCase().split('.').pop();
                        if (ext === 'pdf') mimeType = 'application/pdf';
                        else mimeType = 'application/octet-stream';
                    }

                    mediaPart = {
                        inlineData: {
                            data: buffer.toString('base64'),
                            mimeType
                        }
                    };
                    userPrompt = message.text || "このファイルを解析して、システムプロンプトに従って回答してください。";
                } catch (dlErr: any) {
                    console.error('[MEDIA_DL_ERR]', dlErr.message);
                    userPrompt = `(メディアの取得に失敗しました: ${dlErr.message})`;
                }
            } else {
                return null;
            }

            try {
                const responseText = await getGeminiResponse(geminiApiKey, aiConfig?.systemPrompt || "", userPrompt, mediaPart, aiConfig?.model);
                const flexMessage = parseRichMessage(responseText);

                if (flexMessage) {
                    return await client.replyMessage(event.replyToken, flexMessage);
                }
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

async function getGeminiResponse(apiKey: string, systemPrompt: string, userMessage: string, mediaPart?: any, preferredModel?: string) {
    const WEBHOOK_VERSION = 'v1.6.4-surgical';
    const cleanKey = apiKey.trim();

    // Clean and normalize the preferred model name (remove UI annotations like "(推奨)")
    // Extract valid model ID using regex (e.g., "Gemini 1.5 Flash (推奨)" -> "gemini-1.5-flash")
    let selectedModel = 'gemini-1.5-flash-latest';
    if (preferredModel) {
        const match = preferredModel.toLowerCase().match(/gemini-[a-z0-9\.-]+/);
        if (match) selectedModel = match[0];
    }

    // Construct the fallback list - Leading with 2.0 as it's the most responsive for this user
    const fallbackModels = ['gemini-2.0-flash-exp', 'gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-1.5-pro', 'gemini-pro'];
    const modelQueue = Array.from(new Set([selectedModel, ...fallbackModels]));

    let lastError = '';
    let attemptLogs: string[] = [];

    for (const model of modelQueue) {
        // Try both v1 and v1beta API versions
        for (const apiVer of ['v1beta', 'v1']) {
            try {
                const url = `https://generativelanguage.googleapis.com/${apiVer}/models/${model}:generateContent?key=${cleanKey}`;

                const parts: any[] = [{ text: `System: ${systemPrompt}\n\nUser: ${userMessage}` }];
                if (mediaPart) {
                    parts.push(mediaPart);
                }

                const sendRequest = () => fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts }],
                        generationConfig: { temperature: 0.7, maxOutputTokens: 1000 }
                    })
                });

                let response = await sendRequest();

                // Simple retry for 429 (Rate Limit) - Increased to 3s for v1.6.2
                if (response.status === 429) {
                    console.warn(`[429 Retry] Waiting 3s for ${model}...`);
                    await new Promise(r => setTimeout(r, 3000));
                    response = await sendRequest();
                }

                const data: any = await response.json();

                // Track every attempt status
                const shortModel = model.replace('gemini-', '');
                attemptLogs.push(`${apiVer === 'v1beta' ? 'β' : 'v1'}/${shortModel}:${response.status}`);

                if (response.ok) {
                    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "No AI reply";
                }

                lastError = data?.error?.message || JSON.stringify(data);
                const errorCode = data?.error?.code;

                // Log detailed diagnostic on each failure
                console.warn(`[Gemini Failed] ${apiVer}/${model} (Status: ${response.status}): ${lastError}`);

                // Specific trap for "Not Found" - might be version mismatch or disabled API
                if (errorCode === 404 || lastError.toLowerCase().includes('not found')) {
                    // If it's the last try for this model/version, we will move to next
                    continue;
                }

                // Critical Quota/Rate Limit check: try next model in queue
                if (lastError.toLowerCase().includes('quota') || lastError.includes('429')) {
                    console.warn(`[Quota Hit] ${model}: ${lastError}`);
                    continue;
                }

                console.warn(`[Gemini Error] ${model} failed: ${lastError}`);
            } catch (e: any) {
                lastError = e.message;
                attemptLogs.push(`${model}:ERR`);
                console.error(`[Gemini Fatal] ${model}: ${e.message}`);
            }
        }
    }

    // --- [NEW] Ultra-Minimal Fallback (v1.5.8) ---
    // If we've reached here with a quota error, try one last time with ZERO system prompt.
    // This helps determine if the prompt content or length is the actual blocker.
    if (lastError.toLowerCase().includes('quota') || lastError.includes('429')) {
        try {
            console.log(`[Ultra Fallback] Trying minimal request for ${modelQueue[0]}...`);
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelQueue[0]}:generateContent?key=${cleanKey}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: userMessage }] }], // No system prompt!
                    generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
                })
            });
            const data: any = await response.json();
            if (response.ok) {
                const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) return `(診断：プロンプトなしで回答に成功しました。システムプロンプトの長さや内容が制限の原因だった可能性があります。)\n\n${text}`;
            }
            lastError = data?.error?.message || lastError;
        } catch (e) {
            console.error("[Ultra Fallback] Failed:", e);
        }
    }

    // Final error reporting with Key Hint, Version, and Token Diagnostics
    const keyHint = cleanKey.length >= 4 ? `(Key: ...${cleanKey.slice(-4)})` : '(Key: Invalid)';
    const diag = `[Len: Sys=${systemPrompt.length}, User=${userMessage.length}]`;
    const trace = `[Trace: ${attemptLogs.join(', ')}]`;

    if (lastError.toLowerCase().includes('quota') || lastError.includes('429')) {
        throw new Error(`[Google AI Quota] 制限に達しました。${keyHint} ${diag} ${trace} [Ver: ${WEBHOOK_VERSION}]\n\n【詳細】${lastError.substring(0, 100)}...`);
    }

    throw new Error(`AIの応答に失敗しました。${keyHint} ${diag} ${trace} [Ver: ${WEBHOOK_VERSION}] (Last error: ${lastError.substring(0, 50)}...)`);
}

/**
 * Parses AI response text for shorthands like [LINK:label|url] or [BUTTON:label|text]
 * and converts them into a LINE Flex Message.
 */
function parseRichMessage(text: string): any {
    const linkRegex = /\[LINK:([^|]+)\|([^\]]+)\]/g;
    const buttonRegex = /\[BUTTON:([^|]+)\|([^\]]+)\]/g;

    const links = Array.from(text.matchAll(linkRegex));
    const buttons = Array.from(text.matchAll(buttonRegex));

    if (links.length === 0 && buttons.length === 0) return null;

    // Clean text: remove the tags
    let cleanText = text.replace(linkRegex, '').replace(buttonRegex, '').trim();
    if (!cleanText) cleanText = "以下のメニューをご確認ください：";

    const footerContents: any[] = [];

    // Add Links
    links.forEach(match => {
        footerContents.push({
            type: 'button',
            action: {
                type: 'uri',
                label: match[1],
                uri: match[2]
            },
            style: 'primary',
            color: '#00b900',
            margin: 'sm',
            height: 'sm'
        });
    });

    // Add Buttons
    buttons.forEach(match => {
        footerContents.push({
            type: 'button',
            action: {
                type: 'message',
                label: match[1],
                text: match[2]
            },
            style: 'secondary',
            margin: 'sm',
            height: 'sm'
        });
    });

    return {
        type: 'flex',
        altText: cleanText,
        contents: {
            type: 'bubble',
            body: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    {
                        type: 'text',
                        text: cleanText,
                        wrap: true,
                        size: 'md',
                        color: '#333333'
                    }
                ]
            },
            footer: {
                type: 'box',
                layout: 'vertical',
                spacing: 'sm',
                contents: footerContents
            }
        }
    };
}
