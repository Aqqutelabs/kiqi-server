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
const axios_1 = __importDefault(require("axios"));
// Simple E2E script that:
// 1. Requests SendGrid verification for a sender
// 2. Polls the confirm endpoint until the local sender is marked verified (or timeout)
// 3. Creates an email list
// 4. Creates and auto-starts a campaign using the verified sender and the list
// Usage: set environment variables and run with ts-node
//  SENDGRID_API_KEY (for SendGrid operations) - must be configured in server env
//  AUTH_TOKEN - Bearer token for your API auth
//  BASE_URL - API base (default http://localhost:5000)
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const AUTH_TOKEN = process.env.AUTH_TOKEN || '';
if (!AUTH_TOKEN) {
    console.error('Please set AUTH_TOKEN environment variable');
    process.exit(1);
}
const headers = {
    Authorization: `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json'
};
function requestSendGridVerification(email, senderName) {
    return __awaiter(this, void 0, void 0, function* () {
        const payload = {
            nickname: `${senderName} (test)`,
            senderName,
            email,
            address: '1 Test Lane',
            city: 'Testville',
            state: 'TS',
            zip: '12345',
            country: 'US'
        };
        const resp = yield axios_1.default.post(`${BASE_URL}/api/v1/sender-emails/sendgrid/request-verification`, payload, { headers });
        return resp.data.data; // local sender record
    });
}
function confirmSendGridVerification(localSenderId) {
    return __awaiter(this, void 0, void 0, function* () {
        const resp = yield axios_1.default.post(`${BASE_URL}/api/v1/sender-emails/sendgrid/confirm-verification`, { senderId: localSenderId }, { headers });
        return resp.data.data;
    });
}
function createEmailList(name, emails) {
    return __awaiter(this, void 0, void 0, function* () {
        const resp = yield axios_1.default.post(`${BASE_URL}/api/v1/email-lists`, { email_listName: name, emails }, { headers });
        return resp.data.data;
    });
}
function createCampaign(campaignPayload) {
    return __awaiter(this, void 0, void 0, function* () {
        const resp = yield axios_1.default.post(`${BASE_URL}/api/v1/campaigns`, campaignPayload, { headers });
        return resp.data;
    });
}
function pollConfirm(localSenderId_1) {
    return __awaiter(this, arguments, void 0, function* (localSenderId, timeoutMs = 5 * 60 * 1000, intervalMs = 10 * 1000) {
        var _a;
        const start = Date.now();
        while (Date.now() - start < timeoutMs) {
            try {
                const result = yield confirmSendGridVerification(localSenderId);
                if (result && result.verified)
                    return result;
                console.log('Not verified yet, retrying...');
            }
            catch (err) {
                // If not verified, the endpoint may return 400. Continue polling.
                console.log('Confirm check returned:', ((_a = err === null || err === void 0 ? void 0 : err.response) === null || _a === void 0 ? void 0 : _a.data) || (err === null || err === void 0 ? void 0 : err.message));
            }
            yield new Promise(r => setTimeout(r, intervalMs));
        }
        throw new Error('Timeout waiting for sender verification');
    });
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const testSenderEmail = `e2e+${Date.now()}@example.com`;
            console.log('1) Requesting SendGrid verification for', testSenderEmail);
            const localSender = yield requestSendGridVerification(testSenderEmail, 'E2E Test Sender');
            console.log('Local sender created:', localSender);
            console.log('2) Polling for SendGrid verification (check your inbox and click SendGrid link)');
            const verified = yield pollConfirm(localSender._id, 10 * 60 * 1000, 15 * 1000);
            console.log('Sender verified:', verified);
            console.log('3) Creating email list');
            const list = yield createEmailList('E2E List', [testSenderEmail]);
            console.log('Email list created:', list);
            console.log('4) Creating and auto-starting campaign');
            const campaignPayload = {
                campaignName: 'E2E Test Campaign',
                subjectLine: 'E2E test subject',
                senderId: localSender._id,
                autoStart: true,
                audience: {
                    emailLists: [list._id]
                }
            };
            const campaignResp = yield createCampaign(campaignPayload);
            console.log('Campaign response:', campaignResp);
        }
        catch (err) {
            console.error('E2E script failed:', ((_a = err === null || err === void 0 ? void 0 : err.response) === null || _a === void 0 ? void 0 : _a.data) || (err === null || err === void 0 ? void 0 : err.message) || err);
            process.exit(1);
        }
    });
}
run();
