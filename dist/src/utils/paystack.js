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
exports.verifyPaystackPayment = exports.initializePaystackPayment = void 0;
const axios_1 = __importDefault(require("axios"));
const initializePaystackPayment = (params) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        console.log(`📱 Initializing Paystack Payment:
           Amount in Kobo: ${params.amount}
           Amount in NGN: ${params.amount / 100}
           Email: ${params.email}
           Reference: ${params.reference}`);
        const response = yield axios_1.default.post('https://api.paystack.co/transaction/initialize', params, {
            headers: {
                'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        const { data } = response.data;
        console.log(`✅ Paystack initialization successful. Access Code: ${data.access_code}`);
        return {
            authorization_url: data.authorization_url,
            access_code: data.access_code,
            reference: data.reference
        };
    }
    catch (error) {
        if (axios_1.default.isAxiosError(error)) {
            console.error(`❌ Paystack initialization failed:`, (_a = error.response) === null || _a === void 0 ? void 0 : _a.data);
            throw new Error(`Paystack initialization failed: ${((_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.message) || error.message}`);
        }
        throw error;
    }
});
exports.initializePaystackPayment = initializePaystackPayment;
const verifyPaystackPayment = (reference) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const response = yield axios_1.default.get(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: {
                'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
            }
        });
        return response.data.data;
    }
    catch (error) {
        if (axios_1.default.isAxiosError(error)) {
            throw new Error(`Paystack verification failed: ${((_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || error.message}`);
        }
        throw error;
    }
});
exports.verifyPaystackPayment = verifyPaystackPayment;
