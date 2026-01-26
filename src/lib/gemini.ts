export async function getGeminiResponse(apiKey: string, systemPrompt: string, userMessage: string) {
    const cleanKey = apiKey.trim();
    if (!cleanKey) throw new Error("APIキーが入力されていません。");

    // The user's account specifically listed 2.0 and 2.5 models.
    // We will try Lite versions first as they often have more stable free quotas.
    const modelsToTry = [
        "gemini-2.0-flash-lite",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-2.5-flash-lite",
        "gemini-2.5-flash"
    ];

    let lastErrorDetails: any = null;

    for (const modelName of modelsToTry) {
        // v1beta is required for 2.x models
        const version = modelName.includes("2.") ? "v1beta" : "v1";
        const url = `https://generativelanguage.googleapis.com/${version}/models/${modelName}:generateContent?key=${cleanKey}`;

        try {
            console.log(`[Gemini DEBUG] Trying ${modelName}...`);
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: `あなたは以下の設定に従うチャットボットです。\n設定: ${systemPrompt}\n\nユーザーメッセージ: ${userMessage}\n回答:` }]
                    }],
                    generationConfig: { temperature: 0.7, maxOutputTokens: 1000 }
                })
            });

            const data = await response.json();

            if (response.ok) {
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                    console.log(`[Gemini DEBUG] Success with ${modelName}`);
                    return text;
                }
            }

            console.warn(`[Gemini DEBUG] ${modelName} failed (${response.status}):`, data.error?.message);
            lastErrorDetails = { status: response.status, data };

            // CRITICAL FIX: If status is 429 (Quota) OR 404 (Not Found), we MUST continue to try other models.
            // "limit: 0" is a type of 429 that means "this model is not for you", so we skip it.
            if (response.status === 429 || response.status === 404) {
                continue;
            }

            // If it's a 400 (Invalid Key), stop immediately
            if (response.status === 400 && JSON.stringify(data).includes("API_KEY_INVALID")) {
                throw new Error("APIキーが無効です。AI Studioで新しいキーを発行してください。");
            }

            // Other errors (403 restricted, etc.) - break loop
            break;

        } catch (err: any) {
            if (err.message.includes("APIキーが無効")) throw err;
            lastErrorDetails = { error: err.message };
            continue; // Try next model on network/fetch errors too
        }
    }

    // Comprehensive error if all attempts fail
    const finalMsg = lastErrorDetails?.data?.error?.message || lastErrorDetails?.error || "不明なエラー";
    const status = lastErrorDetails?.status || "Error";

    throw new Error(`【Gemini接続エラー】
モデルを順に試しましたが、利用可能なものが見つかりませんでした。

詳細: ${finalMsg} (${status})

※もしお使いのアカウントが『お仕事用(Google Workspace)』の場合、Geminiの利用が制限されている可能性が高いです。個人の@gmail.comアカウントでキーを作成し直すことをお勧めします。`);
}
