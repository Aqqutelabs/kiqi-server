import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({GEMINI_API_KEY});

export const GoogleAI = async () => {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "Explain how AI works in a few words",
    })
    console.log(response.text)
}