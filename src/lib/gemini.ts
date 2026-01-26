export async function getGeminiResponse(apiKey: string, systemPrompt: string, userMessage: string) {
    const cleanKey = apiKey.trim();
    if (!cleanKey) throw new Error("APIキーが入力されていません。");

    // Standard models to try in order of preference
    const modelsToTry = [
        "gemini-1.5-flash",
        "gemini-1.5-flash-latest",
        "gemini-2.0-flash-exp",
        "gemini-1.5-pro"
    ];

    let lastError: any = null;

    for (const modelName of modelsToTry) {
        // We'll try v1beta for -exp models, and v1 for others, but v1beta is generally more permissive
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${cleanKey}`;

        try {
            console.log(`[Gemini DEBUG] Attempting ${modelName}...`);
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: `あなたは以下の設定のチャットボットです。\n設定: ${systemPrompt}\n\nユーザーメッセージ: ${userMessage}` }]
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

            // Record the error but continue to next model if it's a 404
            console.warn(`[Gemini DEBUG] ${modelName} returned ${response.status}:`, data.error?.message);
            lastError = { status: response.status, message: data.error?.message };

            if (response.status === 404) continue;
            break; // Stop for 403, 400, etc.

        } catch (err: any) {
            console.error(`[Gemini DEBUG] Fetch error for ${modelName}:`, err);
            lastError = { error: err.message };
        }
    }

    // IF ALL MODELS FAIL WITH 404, we run a diagnostic to see what IS available
    if (lastError?.status === 404) {
        try {
            const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`;
            const listResp = await fetch(listUrl);
            const listData = await listResp.json();
            console.log("[Gemini DIAGNOSTIC] Available models for this key:", listData);

            // Extract model names for the error message
            const availableNames = listData.models?.map((m: any) => m.name.split('/').pop()).join(', ') || "なし";

            throw new Error(`AIモデルが見つかりません(404)。\nお使いのキーで利用可能なモデル: ${availableNames}\n\n※もし『なし』と表示される場合は、AI StudioのプロジェクトでAPIが有効になっていない可能性があります。`);
        } catch (diagErr) {
            throw new Error("AIモデル(404)エラーに加え、利用可能モデルの確認にも失敗しました。APIキーが正しいか、または新しいキーを作成し直してください。");
        }
    }

    throw new Error(`エラーが発生しました(${lastError?.status || '通信失敗'}): ${lastError?.message || lastError?.error || "不明なエラー"}`);
}
