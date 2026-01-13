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
const GoogleAi_service_impl_new_1 = require("../services/impl/GoogleAi.service.impl.new");
function testEmailGeneration() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const aiService = new GoogleAi_service_impl_new_1.GoogleAiServiceImpl();
            // Step 1: Generate initial email
            console.log('Generating initial email...');
            const initialEmail = yield aiService.generateEmail("Write a marketing email announcing our new AI-powered email generation service");
            console.log('\nInitial Email:');
            console.log('ID:', initialEmail._id);
            console.log('Content:', initialEmail.result);
            // Step 2: Regenerate the email with modifications
            console.log('\nRegenerating email with modifications...');
            const regeneratedEmail = yield aiService.regenerateEmail(initialEmail._id, "Make it more concise and add a clear call to action at the end");
            console.log('\nRegenerated Email:');
            console.log('Original ID:', regeneratedEmail.emailId);
            console.log('New Content:', regeneratedEmail.regenerated);
        }
        catch (error) {
            console.error('Error:', error);
        }
    });
}
// Run the test
testEmailGeneration();
