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
const fs_1 = __importDefault(require("fs"));
// Usage: set BASE_URL and AUTH_TOKEN in environment, e.g.
// BASE_URL=http://localhost:3000/api/sms AUTH_TOKEN=Bearer\ <token> node -r ts-node/register scripts/seed-sms-templates.ts
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000/api/sms';
const AUTH = process.env.AUTH_TOKEN || '';
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const data = JSON.parse(fs_1.default.readFileSync('sample-data/sms-templates.json', 'utf8'));
        for (const tpl of data) {
            try {
                const res = yield axios_1.default.post(`${BASE_URL}/templates`, tpl, {
                    headers: {
                        Authorization: AUTH,
                        'Content-Type': 'application/json'
                    }
                });
                console.log('Created:', res.data.data._id, res.data.data.title);
            }
            catch (err) {
                console.error('Failed to create', tpl.title, ((_a = err.response) === null || _a === void 0 ? void 0 : _a.data) || err.message);
            }
        }
    });
}
main().catch(console.error);
