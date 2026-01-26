import { GoogleGenerativeAI } from "@google/generative-ai";

export async function getGeminiResponse(apiKey: string, systemPrompt: string, userMessage: string) {
    const genAI = new GoogleGenerativeAI(apiKey);

    // Attempt multiple model identifiers to find one that works for the user's key/region
    // Including both 1.5 and 1.0 versions as fallbacks
    const modelsToTry = [
        "gemini-1.5-flash",
        "gemini-1.5-flash-latest",
        "gemini-1.5-pro",
        "gemini-pro" // 1.0 Pro
    ];

    let lastError: any = null;

    for (const modelName of modelsToTry) {
        try {
            console.log(`[Gemini Debug] Attempting: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });

            // Using simple generateContent for maximum compatibility first
            // We combine the system prompt and user message into one prompt to ensure the persona is set
            const fullPrompt = `System/Character Setting: ${systemPrompt}\n\nUser Message: ${userMessage}\n\nPlease respond naturally according to the setting above.`;

            const result = await model.generateContent(fullPrompt);
            const response = await result.response;
            const text = response.text();

            if (text) {
                console.log(`[Gemini Debug] Success with model: ${modelName}`);
                return text;
            }
        } catch (error: any) {
            console.warn(`[Gemini Debug] Model ${modelName} failed:`, error.message);
            lastError = error;

            const errMsg = error.message || "";
            // If it's a key error, stop immediately
            if (errMsg.includes("API_KEY_INVALID") || errMsg.includes("expired") || errMsg.includes("400")) {
                throw new Error("APIキーが正しくありません。AI Studioで『New API Key in new project』として作成した最新のキーを貼り付けてください。");
            }

            // If it's a 404, try the next model
            if (errMsg.includes("404")) continue;

            // For other errors (like quota), stop and report
            break;
        }
    }

    // Comprehensive error reporting
    if (lastError?.message?.includes("404")) {
        throw new Error(`AIモデル(Gemini)が見つかりません。
AI Studio側の設定で「Generative Language API」が有効になっているか、
または別のGoogleアカウントで「新しいAPIキー」を発行し直してみてください。
(デバッグログ: 404 Not Found)`);
    }

    throw lastError || new Error("原因不明のエラーが発生しました。");
}
