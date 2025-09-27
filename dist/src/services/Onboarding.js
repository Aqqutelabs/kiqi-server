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
exports.onboardingService = void 0;
// MOCK DATABASE for onboarding data
const wordpressConnections = [];
const chatbotSettings = [];
exports.onboardingService = {
    saveWordpressConnection: (data) => __awaiter(void 0, void 0, void 0, function* () {
        // In a real app, you would encrypt the password before saving
        const connection = Object.assign({ id: Date.now().toString() }, data);
        wordpressConnections.push(connection);
        console.log("Wordpress Connections:", wordpressConnections);
        return connection;
    }),
    saveChatbotSettings: (data) => __awaiter(void 0, void 0, void 0, function* () {
        const settings = Object.assign({ id: Date.now().toString() }, data);
        chatbotSettings.push(settings);
        console.log("Chatbot Settings:", chatbotSettings);
        return settings;
    })
};
