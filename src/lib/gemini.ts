import { GoogleGenerativeAI } from "@google/generative-ai";

export async function getGeminiResponse(apiKey: string, systemPrompt: string, userMessage: string) {
    const genAI = new GoogleGenerativeAI(apiKey);

    // Attempt multiple model identifiers to find one that works for the user's key/region
    const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-flash-latest"];

    let lastError: any = null;

    for (const modelName of modelsToTry) {
        try {
            console.log(`Attempting Gemini call with model: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });

            // Using startChat for better compatibility across different model versions
            const chat = model.startChat({
                history: [
                    {
                        role: "user",
                        parts: [{ text: `以下の指示に従って、チャットボットとして振る舞ってください。\n指示内容: ${systemPrompt}` }],
                    },
                    {
                        role: "model",
                        parts: [{ text: "承知いたしました。指示された通りのキャラクターで、丁寧かつ知的に回答させていただきます。どのようなご用件でしょうか？" }],
                    },
                ],
            });

            const result = await chat.sendMessage(userMessage);
            const response = await result.response;
            return response.text();
        } catch (error: any) {
            console.warn(`Model ${modelName} failed:`, error.message);
            lastError = error;

            // Check for explicit key errors
            const errMsg = error.message || "";
            if (errMsg.includes("API_KEY_INVALID") || errMsg.includes("expired") || errMsg.includes("400")) {
                throw new Error("APIキーが無効、または期限切れです。Google AI Studioで新しいキーを発行し、設定し直してください。");
            }

            if (errMsg.includes("404")) continue;
            break;
        }
    }

    // If we reach here, it failed for all attempted models
    if (lastError?.message?.includes("404")) {
        throw new Error("AIモデルの読み込みに失敗しました(404)。お使いのAPIキーがこのモデルに対応していない可能性があります。AI Studioで『New API Key in new project』として作り直してみてください。");
    }

    throw lastError || new Error("原因不明のエラーが発生しました。");
}
