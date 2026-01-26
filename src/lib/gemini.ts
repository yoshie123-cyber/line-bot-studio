export async function getGeminiResponse(apiKey: string, systemPrompt: string, userMessage: string) {
    const cleanKey = apiKey.trim();
    if (!cleanKey) throw new Error("APIキーが入力されていません。");

    // Attempting the REST API directly for maximum compatibility and debugging
    // We try gemini-1.5-flash which is the most available model.
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${cleanKey}`;

    const payload = {
        contents: [
            {
                role: "user",
                parts: [{ text: `System Setting: ${systemPrompt}\n\nUser Message: ${userMessage}` }]
            }
        ],
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800,
        }
    };

    try {
        console.log("[Gemini DEBUG] Sending request to REST API...");
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("[Gemini DEBUG] Error Response:", data);

            const errorStatus = response.status;
            const errorMsg = data.error?.message || "不明なエラー";

            if (errorStatus === 400) {
                if (errorMsg.includes("API_KEY_INVALID") || errorMsg.includes("expired")) {
                    throw new Error("APIキーが無効、または期限切れです。Google AI Studioで新しいキーを作成してください。");
                }
                throw new Error(`リクエストエラー(400): ${errorMsg}`);
            }

            if (errorStatus === 404) {
                throw new Error("AIモデル(gemini-1.5-flash)が見つかりません(404)。APIキーの設定または地域の制限を確認してください。");
            }

            if (errorStatus === 403) {
                throw new Error("アクセス権限エラー(403)。このAPIキーでGemini APIが許可されているか確認してください。");
            }

            throw new Error(`通信エラー(${errorStatus}): ${errorMsg}`);
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error("AIからの応答が空でした。");

        return text;
    } catch (error: any) {
        console.error("[Gemini DEBUG] Fetch catch error:", error);
        throw error;
    }
}
