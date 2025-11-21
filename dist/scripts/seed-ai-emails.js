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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const AIEmail_1 = __importDefault(require("../src/models/AIEmail"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_2 = require("mongoose");
dotenv_1.default.config();
const sampleEmails = [
    {
        recipient: 'client@example.com',
        context: 'Follow up after sales meeting',
        tone: 'Professional',
        content: `Subject: Follow-up: Our Meeting on Project Collaboration

Dear [Client Name],

Thank you for taking the time to meet with us yesterday regarding the potential project collaboration. Your insights into the market challenges were particularly valuable, and I believe our solution aligns well with your needs.

I've attached the detailed proposal we discussed, incorporating the specific requirements you mentioned during our conversation.

Would you be available for a brief follow-up call next week to address any questions?

Best regards,
[Your name]`,
        userId: new mongoose_2.Types.ObjectId()
    },
    {
        recipient: 'team@company.com',
        context: 'Weekly progress update',
        tone: 'Professional',
        content: `Subject: Weekly Team Progress Update - October 2025

Hi team,

I hope this email finds you well. Here's a quick summary of our progress this week:

Key Achievements:
- Completed Phase 1 of the client project
- Launched new feature testing
- Resolved 15 high-priority tickets

Next Week's Focus:
- Begin Phase 2 implementation
- Team training sessions
- Client feedback review

Please let me know if you have any questions or concerns.

Best regards,
[Manager Name]`,
        userId: new mongoose_2.Types.ObjectId()
    },
    {
        recipient: 'hr@startup.com',
        context: 'Job application follow-up',
        tone: 'Professional',
        content: `Subject: Following Up - Senior Developer Position Application

Dear Hiring Manager,

I hope this email finds you well. I am writing to follow up on my application for the Senior Developer position at [Company Name], submitted last week.

I remain very enthusiastic about the opportunity to join your team and contribute to your innovative projects. I believe my experience in [specific technology] aligns perfectly with your requirements.

Please let me know if you need any additional information from me.

Best regards,
[Your name]`,
        userId: new mongoose_2.Types.ObjectId()
    }
];
function seedEmails() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Connect to MongoDB
            yield mongoose_1.default.connect(process.env.MONGODB_URI);
            console.log('Connected to MongoDB');
            // Clear existing data
            yield AIEmail_1.default.deleteMany({});
            console.log('Cleared existing email data');
            // Insert sample emails
            const insertedEmails = yield AIEmail_1.default.insertMany(sampleEmails);
            console.log('Inserted sample emails:', insertedEmails.map(email => email._id));
            console.log('\nTest the API with these requests:');
            console.log('\n1. Generate a new email:');
            console.log('POST http://localhost:3000/api/ai-email/generate-email');
            console.log(`{
  "recipient": "partner@business.com",
  "context": "Partnership proposal",
  "tone": "Professional"
}`);
            console.log('\n2. Regenerate an email (use one of the IDs from above):');
            console.log('POST http://localhost:3000/api/ai-email/regenerate-email');
            console.log(`{
  "emailId": "[INSERT_EMAIL_ID]",
  "instructions": "Make it more concise and add a specific meeting time proposal"
}`);
        }
        catch (error) {
            console.error('Error seeding data:', error);
        }
        finally {
            yield mongoose_1.default.disconnect();
            console.log('Disconnected from MongoDB');
        }
    });
}
seedEmails();
