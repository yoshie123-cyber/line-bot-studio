export async function getGeminiResponse(apiKey: string, systemPrompt: string, userMessage: string) {
    const cleanKey = apiKey.trim();
    if (!cleanKey) throw new Error("APIキーが入力されていません。");

    // DISCOVERED MODELS: gemini-2.5-flash, gemini-2.5-pro, gemini-2.0-flash, etc.
    // We will prioritize 2.0/2.5 flash which were confirmed available for this key.
    const modelsToTry = [
        "gemini-2.0-flash",
        "gemini-2.5-flash",
        "gemini-2.0-flash-lite",
        "gemini-1.5-flash" // Fallback
    ];

    let lastError: any = null;

    for (const modelName of modelsToTry) {
        // Models like 2.0/2.5 often require v1beta endpoint during early access
        const version = modelName.includes("2.") ? "v1beta" : "v1";
        const url = `https://generativelanguage.googleapis.com/${version}/models/${modelName}:generateContent?key=${cleanKey}`;

        try {
            console.log(`[Gemini DEBUG] Trying ${version}/${modelName}...`);
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: `以下の設定に従って、ユーザーと対話してください。\n設定: ${systemPrompt}\n\nユーザーメッセージ: ${userMessage}\n回答:` }]
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

            lastError = { status: response.status, data };
            console.warn(`[Gemini DEBUG] ${modelName} failed:`, data.error?.message);

            if (response.status === 404) continue;
            break;
        } catch (err: any) {
            lastError = { error: err.message };
        }
    }

    throw new Error(`AIとの通信に失敗しました。
理由: ${lastError?.data?.error?.message || lastError?.error || "不明なエラー"}
(試行したモデル: ${modelsToTry.join(", ")})`);
}
