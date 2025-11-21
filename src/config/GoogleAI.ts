import { GoogleGenAI } from "@google/genai";

// Google AI calls commented out to avoid production quota errors (RATE_LIMIT_EXCEEDED)
// The library is still imported so callers can enable it later by restoring the code below.
// const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});

export const GoogleAI = async () => {
    // No-op startup for Google AI integration while quota issues are investigated.
    // If you need to re-enable, restore the generateContent call and ensure your
    // project has sufficient quota or implement proper rate-limiting / retry logic.

    /* Example (commented):
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: "Explain how AI works in a few words",
        });
        console.log(response.text);
    } catch (err) {
        console.warn('GoogleAI generateContent skipped due to error:', err);
    }
    */

    return;
}