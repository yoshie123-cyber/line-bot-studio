export async function getGeminiResponse(apiKey: string, systemPrompt: string, userMessage: string) {
    const cleanKey = apiKey.trim();
    if (!cleanKey) throw new Error("APIキーが入力されていません。");

    // We'll focus on the most standard endpoint and model to avoid confusion.
    // gemini-1.5-flash is the most widely available free-tier model.
    const baseUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
    const url = `${baseUrl}?key=${cleanKey}`;

    try {
        console.log("[Gemini DEBUG] Attempting direct fetch to v1beta gemini-1.5-flash");

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `あなたは以下の指示に従うチャットボットです。\n指示: ${systemPrompt}\n\nユーザーメッセージ: ${userMessage}\n回答:`
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1000,
                }
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("[Gemini DEBUG] failure response:", data);

            const status = response.status;
            const message = data.error?.message || "不明なエラー";

            if (status === 404) {
                throw new Error(`【404エラー】AIモデルが見つかりません。
これはプログラムではなく、APIキーの権限の問題です。
1. AI Studioで『Create API key in NEW project』から新しくキーを作り直してください。
2. もしお仕事用(Google Workspace)アカウントをお使いなら、管理者によって制限されている可能性があります。個人の@gmail.comアカウントで試すことを強くお勧めします。`);
            }

            throw new Error(`Google APIエラー(${status}): ${message}`);
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error("AIから有効な応答が得られませんでした。");

        return text;

    } catch (error: any) {
        console.error("[Gemini DEBUG] Unexpected error:", error);
        throw error;
    }
}
