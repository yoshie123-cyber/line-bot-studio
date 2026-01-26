import { GoogleGenerativeAI } from "@google/generative-ai";

export async function getGeminiResponse(apiKey: string, systemPrompt: string, userMessage: string) {
    const genAI = new GoogleGenerativeAI(apiKey);

    // Most reliable model names as of late 2024/2025
    const modelsToTry = [
        "gemini-1.5-flash",
        "gemini-1.5-flash-latest",
        "gemini-1.5-pro-latest",
        "gemini-pro"
    ];

    let lastError: any = null;

    for (const modelName of modelsToTry) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });

            // Simple combined prompt to avoid systemInstruction conflicts in some regions
            const fullPrompt = `${systemPrompt}\n\n質問者: ${userMessage}\n回答:`;

            const result = await model.generateContent(fullPrompt);
            const response = await result.response;
            const text = response.text();

            if (text) return text;
        } catch (error: any) {
            lastError = error;
            const errMsg = error.message || "";

            // Critical identity/key errors - don't retry
            if (errMsg.includes("API_KEY_INVALID") || errMsg.includes("expired") || errMsg.includes("400")) {
                throw new Error("APIキーが無効です。作成し直すか、正しいキーを貼り付けてください。");
            }

            // If 404, the model name might be wrong or unavailable for this key, so try next
            if (errMsg.includes("404")) continue;

            // Other errors (quota, etc.) should break and report
            break;
        }
    }

    if (lastError?.message?.includes("404")) {
        throw new Error(`【Gemini 404エラー】
AIモデルが呼び出せません。以下の手順を試してください：
1. AI Studioで『Create API key in NEW project』ボタンから新しいキーを作成する。
2. 作成したばかりのキーをこの画面の『AI設定』に貼り直して保存する。
(ご利用のアカウントやプロジェクトの設定が古い可能性があります)`);
    }

    throw lastError || new Error("AIとの通信に失敗しました。");
}
