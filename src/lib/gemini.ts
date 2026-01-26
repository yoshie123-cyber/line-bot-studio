import { GoogleGenerativeAI } from "@google/generative-ai";

export async function getGeminiResponse(apiKey: string, systemPrompt: string, userMessage: string) {
    const genAI = new GoogleGenerativeAI(apiKey);

    // Attempt multiple model identifiers to find one that works for the user's key/region
    // "gemini-1.5-flash-latest" is often the most stable alias
    const modelsToTry = [
        "gemini-1.5-flash-latest",
        "gemini-1.5-flash",
        "gemini-1.5-pro-latest",
        "gemini-pro"
    ];

    let lastError: any = null;

    for (const modelName of modelsToTry) {
        try {
            console.log(`[Gemini Debug] Attempting model: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });

            // Combine instructions for maximum compatibility if systemInstruction fails
            const fullPrompt = `System Setting: ${systemPrompt}\n\nUser Message: ${userMessage}\n\nResponse:`;

            const result = await model.generateContent(fullPrompt);
            const response = await result.response;
            const text = response.text();

            if (text) {
                console.log(`[Gemini Debug] Success with ${modelName}`);
                return text;
            }
        } catch (error: any) {
            console.warn(`[Gemini Debug] Model ${modelName} failed:`, error.message);
            lastError = error;

            const errMsg = error.message || "";
            // Key errors
            if (errMsg.includes("API_KEY_INVALID") || errMsg.includes("expired") || errMsg.includes("400")) {
                throw new Error("APIキーが無効、または期限切れです。AI Studioで新しいキーを作成してください。");
            }

            // 404 means the model is not found in the current project context
            if (errMsg.includes("404")) continue;

            // For other errors (over quota, etc.), stop and report
            break;
        }
    }

    // Special message for persistent 404
    if (lastError?.message?.includes("404")) {
        throw new Error(`【Gemini接続エラー】
ご利用のAPIキーが「AIモデル」の呼び出しを許可されていません。
解決策：AI Studioで、既存のキーを使うのではなく必ず『Create API key in NEW project』から新しくキーを発行してください。
(デバッグ情報: 404 Not Found)`);
    }

    throw lastError || new Error("AIの応答を取得できませんでした。再度お試しください。");
}
