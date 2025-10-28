import { GoogleGenAI } from "@google/genai";

// Google AI temporarily disabled due to quota exceeded
const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});

export const GoogleAI = async () => {

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "Explain how AI works in a few words",
    })
    console.log(response.text)
}