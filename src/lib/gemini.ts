export async function getGeminiResponse(apiKey: string, systemPrompt: string, userMessage: string) {
    const cleanKey = apiKey.trim();
    if (!cleanKey) throw new Error("APIキーが入力されていません。");

    // Dual-strategy: Try both stable (v1) and beta (v1beta) endpoints with various model aliases
    const strategies = [
        { version: 'v1beta', model: 'gemini-1.5-flash' },
        { version: 'v1', model: 'gemini-1.5-flash' },
        { version: 'v1beta', model: 'gemini-1.5-flash-latest' },
        { version: 'v1beta', model: 'gemini-pro' }
    ];

    let lastErrorDetails: any = null;

    for (const strategy of strategies) {
        const url = `https://generativelanguage.googleapis.com/${strategy.version}/models/${strategy.model}:generateContent?key=${cleanKey}`;

        try {
            console.log(`[Gemini DEBUG] Trying ${strategy.version} / ${strategy.model}...`);
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        role: "user",
                        parts: [{ text: `System Setting: ${systemPrompt}\n\nUser Message: ${userMessage}` }]
                    }],
                    generationConfig: { temperature: 0.7, maxOutputTokens: 800 }
                })
            });

            const data = await response.json();

            if (response.ok) {
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                    console.log(`[Gemini DEBUG] Success with ${strategy.version}/${strategy.model}`);
                    return text;
                }
            }

            // If not OK, record the error and try next
            lastErrorDetails = { status: response.status, data };
            console.warn(`[Gemini DEBUG] Failed ${strategy.version}/${strategy.model}:`, data.error?.message);

            // If it's a key error (400), don't bother trying other models
            if (response.status === 400 && (data.error?.message?.includes("API_KEY_INVALID") || data.error?.message?.includes("expired"))) {
                throw new Error("APIキーが無効、または期限切れです。AI Studioで新しいキーを作成してください。");
            }

        } catch (err: any) {
            // Re-throw key-specific errors immediately
            if (err.message.includes("APIキーが無効")) throw err;
            lastErrorDetails = { error: err.message };
        }
    }

    // Comprehensive error if all strategies fail
    const errorMsg = lastErrorDetails.data?.error?.message || lastErrorDetails.error || "接続失敗";
    const status = lastErrorDetails.status || "Unknown";

    throw new Error(`AIとの通信に失敗しました(${status})。\n詳細: ${errorMsg}\n\n※404エラーが続く場合は、AI Studioの『Settings』→『Model settings』を確認するか、別のアカウントでキーを作り直してみてください。`);
}
