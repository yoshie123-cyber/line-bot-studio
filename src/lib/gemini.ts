import { GoogleGenerativeAI } from "@google/generative-ai";

export async function getGeminiResponse(apiKey: string, systemPrompt: string, userMessage: string) {
    try {
        const genAI = new GoogleGenerativeAI(apiKey);

        // Use gemini-1.5-flash which is the standard identifier. 
        // If 404 persists, it might be due to API key permissions or regional availability.
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
        });

        // Some versions of the SDK handle systemInstruction better inside the startChat or generateContent
        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: `システム設定: ${systemPrompt}` }],
                },
                {
                    role: "model",
                    parts: [{ text: "了解しました。その設定に基づいて回答します。" }],
                },
            ],
        });

        const result = await chat.sendMessage(userMessage);
        const response = await result.response;
        return response.text();
    } catch (error: any) {
        console.error("Gemini API Error details:", error);

        // Specific error handling for 404
        if (error.message?.includes("404")) {
            throw new Error("AIモデルが見つかりません(404)。APIキーが正しく取得されているか、プロジェクトの設定を確認してください。");
        }

        throw error;
    }
}
