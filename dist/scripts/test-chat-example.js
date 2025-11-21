"use strict";
// Example of how to use the AI Chat API
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// First message (starting a new chat)
function startNewChat() {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield fetch('http://your-api/ai-chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: "Hello, I'd like to discuss email marketing strategies."
            })
        });
        const data = yield response.json();
        // data will include a sessionId - save this for follow-up messages
        const { sessionId, aiResponse } = data;
        console.log('AI Response:', aiResponse);
        console.log('Session ID (save this):', sessionId);
        return sessionId;
    });
}
// Follow-up message (using existing session)
function continueChat(sessionId, message) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield fetch('http://your-api/ai-chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sessionId, // Include the sessionId from the previous response
                message
            })
        });
        const data = yield response.json();
        console.log('AI Response:', data.aiResponse);
    });
}
// Example usage:
function exampleChatSession() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Start a new chat
            console.log('Starting new chat...');
            const sessionId = yield startNewChat();
            // Continue the conversation
            console.log('\nSending follow-up message...');
            yield continueChat(sessionId, "Can you give me specific examples of effective email subject lines?");
            // Another follow-up
            console.log('\nSending another follow-up...');
            yield continueChat(sessionId, "How can I improve open rates for these emails?");
        }
        catch (error) {
            console.error('Error:', error);
        }
    });
}
// Run the example
exampleChatSession();
