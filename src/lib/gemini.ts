import { GoogleGenerativeAI } from "@google/generative-ai";

export async function getGeminiResponse(apiKey: string, systemPrompt: string, userMessage: string) {
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: systemPrompt
        });

        const result = await model.generateContent(userMessage);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw error;
    }
}
