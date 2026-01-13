"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleAI = void 0;
// Google AI calls commented out to avoid production quota errors (RATE_LIMIT_EXCEEDED)
// The library is still imported so callers can enable it later by restoring the code below.
// const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});
const GoogleAI = () => __awaiter(void 0, void 0, void 0, function* () {
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
});
exports.GoogleAI = GoogleAI;
