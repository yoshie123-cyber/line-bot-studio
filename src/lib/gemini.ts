export async function getGeminiResponse(apiKey: string, systemPrompt: string, userMessage: string) {
    const cleanKey = apiKey.trim();
    if (!cleanKey) throw new Error("APIキーが入力されていません。");

    // Strategy 1: Attempt the most stable model on the stable v1 endpoint
    // gemini-1.5-flash is the standard for production v1
    const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-flash-8b", "gemini-pro"];
    let lastError: any = null;

    for (const modelName of modelsToTry) {
        try {
            // Using v1 (Stable) instead of v1beta
            const url = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${cleanKey}`;

            console.log(`[Gemini DEBUG] Trying v1/${modelName}...`);
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: `以下の設定に従って回答してください。\n設定: ${systemPrompt}\n\nユーザーメッセージ: ${userMessage}` }]
                    }],
                    generationConfig: { temperature: 0.7, maxOutputTokens: 1000 }
                })
            });

            const data = await response.json();

            if (response.ok) {
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) return text;
            }

            lastError = { status: response.status, data };

            // If it's a Quota error with limit: 0, it means the model is restricted for this key/region
            if (response.status === 429 && JSON.stringify(data).includes("limit: 0")) {
                console.warn(`[Gemini DEBUG] ${modelName} has limit 0. Trying next...`);
                continue;
            }

            if (response.status === 404) continue;

            // For 400 (Invalid Key), stop immediately
            if (response.status === 400 && JSON.stringify(data).includes("API_KEY_INVALID")) {
                throw new Error("APIキーが無効です。AI Studioで新しいキーを発行してください。");
            }

            break;
        } catch (err: any) {
            if (err.message.includes("APIキーが無効")) throw err;
            lastError = { error: err.message };
        }
    }

    // FINAL DIAGNOSTIC: List every model that THIS key is allowed to use
    try {
        const listUrl = `https://generativelanguage.googleapis.com/v1/models?key=${cleanKey}`;
        const listResp = await fetch(listUrl);
        const listData = await listResp.json();

        const available = listData.models
            ?.map((m: any) => m.name.split('/').pop())
            .filter((name: string) => name.includes("gemini"))
            .join(", ") || "なし";

        throw new Error(`【Gemini接続エラー】
お使いのキーで利用可能なモデル: ${available}

※もし『なし』や知らない名前ばかりの場合は、AI Studioの『New API Key in NEW project』からキーを作り直すと解決します。
(エラーコード: ${lastError?.status || '通信失敗'})`);
    } catch (diagErr: any) {
        if (diagErr.message.includes("利用可能なモデル")) throw diagErr;
        throw new Error(`AIとの通信に失敗しました。
理由: ${lastError?.data?.error?.message || lastError?.error || "不明なエラー"}`);
    }
}
