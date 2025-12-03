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
exports.SenderEmailServiceImpl = void 0;
const http_status_codes_1 = require("http-status-codes");
const SenderEmail_1 = require("../../models/SenderEmail");
const User_1 = require("../../models/User");
const ApiError_1 = require("../../utils/ApiError");
const axios_1 = __importDefault(require("axios"));
class SenderEmailServiceImpl {
    createSenderEmail(senderName, type, email, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const isUserExist = yield SenderEmail_1.SenderModel.findOne({ senderEmail: email });
            if (isUserExist) {
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Email already exists");
            }
            const payload = {
                senderName,
                type: type,
                senderEmail: email,
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            if (userId)
                payload.user_id = userId;
            const sender = yield SenderEmail_1.SenderModel.create(payload);
            return sender;
        });
    }
    getSenderEmailById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return SenderEmail_1.SenderModel.findById(id);
        });
    }
    getAllSenderEmails(userId) {
        if (userId) {
            return SenderEmail_1.SenderModel.find({ user_id: userId });
        }
        return SenderEmail_1.SenderModel.find();
    }
    updateSenderEmail(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const updated = yield SenderEmail_1.SenderModel.findByIdAndUpdate(id, data, {
                new: true,
                runValidators: true,
                updatedAt: Date.now()
            });
            if (!updated) {
                throw new Error("Sender email not found");
            }
            return updated;
        });
    }
    deleteSenderEmail(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield SenderEmail_1.SenderModel.findByIdAndDelete(id);
        });
    }
    // OTP-based requestVerification removed. Use SendGrid verification endpoints instead.
    /**
     * Request SendGrid single-sender verification. This will create a sender in SendGrid
     * which triggers SendGrid to email a verification link to the address.
     */
    requestSendGridVerification(nickname_1, senderName_1, email_1) {
        return __awaiter(this, arguments, void 0, function* (nickname, senderName, email, address = '', city = '', state = '', zip = '', country = 'US', userId) {
            var _a, _b, _c, _d, _e, _f;
            const key = process.env.SENDGRID_API_KEY;
            console.log('i am the correct key', key);
            if (!key)
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'SendGrid API key not configured');
            const existing = yield SenderEmail_1.SenderModel.findOne({ senderEmail: email });
            if (existing && existing.verified) {
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Sender already verified');
            }
            const payload = {
                nickname: nickname || senderName,
                from_email: email,
                from_name: senderName,
                reply_to: email,
                reply_to_name: senderName,
                address: address || '',
                city: city || '',
                state: state || '',
                zip: zip || '',
                country: country || 'US'
            };
            // Diagnostic: log presence of key (masked) and validate it with a lightweight account call
            const maskedKey = key ? (key.length > 8 ? `${key.slice(0, 4)}...${key.slice(-4)}` : '****') : 'MISSING';
            console.log('[SenderService] SendGrid key present:', !!key, 'preview=', maskedKey);
            try {
                // Quick validation to detect invalid/unauthorized keys early
                yield axios_1.default.get('https://api.sendgrid.com/v3/user/account', {
                    headers: { Authorization: `Bearer ${key}` }
                });
            }
            catch (authErr) {
                const authBody = ((_a = authErr === null || authErr === void 0 ? void 0 : authErr.response) === null || _a === void 0 ? void 0 : _a.data) || ((_b = authErr === null || authErr === void 0 ? void 0 : authErr.response) === null || _b === void 0 ? void 0 : _b.body) || (authErr === null || authErr === void 0 ? void 0 : authErr.message);
                console.error('[SenderService] SendGrid key validation failed:', JSON.stringify(authBody));
                // Surface a clear error so operator can fix the key in env
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `SendGrid API key unauthorized: ${JSON.stringify(authBody)}`);
            }
            try {
                const resp = yield axios_1.default.post('https://api.sendgrid.com/v3/verified_senders', payload, {
                    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }
                });
                console.log('respnse:', resp);
                const sgId = resp.data && (resp.data.id || resp.data._id || resp.data.sender_id);
                let sender = existing;
                if (!sender) {
                    sender = yield SenderEmail_1.SenderModel.create({ senderName, type: 'sendgrid', senderEmail: email, user_id: userId, verified: false, sendgridId: sgId });
                }
                else {
                    sender.sendgridId = sgId;
                    sender.verified = false;
                    sender.type = 'sendgrid';
                    if (userId)
                        sender.user_id = userId;
                    yield sender.save();
                }
                return sender;
            }
            catch (err) {
                // Log full SendGrid error body for debugging (but never log the API key)
                try {
                    const body = ((_c = err === null || err === void 0 ? void 0 : err.response) === null || _c === void 0 ? void 0 : _c.data) || ((_d = err === null || err === void 0 ? void 0 : err.response) === null || _d === void 0 ? void 0 : _d.body);
                    if (body)
                        console.error('[SenderService] SendGrid create sender error body:', JSON.stringify(body));
                }
                catch (logErr) {
                    console.error('[SenderService] Failed to log SendGrid error body:', logErr);
                }
                const status = (_e = err === null || err === void 0 ? void 0 : err.response) === null || _e === void 0 ? void 0 : _e.status;
                const msg = ((_f = err === null || err === void 0 ? void 0 : err.response) === null || _f === void 0 ? void 0 : _f.data) || err.message || 'SendGrid request failed';
                // Map authorization errors to a clearer status
                if (status === 401 || status === 403) {
                    throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.UNAUTHORIZED, `SendGrid API unauthorized: ${JSON.stringify(msg)}`);
                }
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `SendGrid create sender failed: ${JSON.stringify(msg)}`);
            }
        });
    }
    /**
     * Confirm SendGrid verification for a local sender record. Checks SendGrid sender status
     * and marks local sender as verified when SendGrid reports verified.
     */
    confirmSendGridVerification(localSenderId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const sender = yield SenderEmail_1.SenderModel.findById(localSenderId);
            if (!sender)
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, 'Sender email not found');
            if (userId && sender.user_id && sender.user_id.toString() !== userId) {
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.FORBIDDEN, 'You do not own this sender email');
            }
            if (!sender.sendgridId)
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'No SendGrid sender ID for this record');
            const key = process.env.SENDGRID_API_KEY;
            if (!key)
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'SendGrid API key not configured');
            try {
                const resp = yield axios_1.default.get(`https://api.sendgrid.com/v3/verified_senders/${sender.sendgridId}`, {
                    headers: { Authorization: `Bearer ${key}` }
                });
                const body = resp.data || {};
                // SendGrid may return a 'status' or 'verified' field; check common patterns
                const isVerified = body.verified === true || body.status === 'verified' || body.is_verified === true;
                if (!isVerified) {
                    throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Sender not yet verified by SendGrid');
                }
                sender.verified = true;
                yield sender.save();
                // Update user's default sender email
                if (sender.user_id) {
                    yield User_1.UserModel.findByIdAndUpdate(sender.user_id, { senderEmail: sender.senderEmail });
                }
                return sender;
            }
            catch (err) {
                try {
                    const body = ((_a = err === null || err === void 0 ? void 0 : err.response) === null || _a === void 0 ? void 0 : _a.data) || ((_b = err === null || err === void 0 ? void 0 : err.response) === null || _b === void 0 ? void 0 : _b.body);
                    if (body)
                        console.error('[SenderService] SendGrid verify check error body:', JSON.stringify(body));
                }
                catch (logErr) {
                    console.error('[SenderService] Failed to log SendGrid verify error body:', logErr);
                }
                const msg = ((_c = err === null || err === void 0 ? void 0 : err.response) === null || _c === void 0 ? void 0 : _c.data) || err.message || 'SendGrid verify check failed';
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `SendGrid verify check failed: ${JSON.stringify(msg)}`);
            }
        });
    }
    /**
     * Confirm SendGrid verification using the token from the SendGrid verification link.
     * This calls SendGrid's `/v3/verified_senders/verify/{token}` endpoint. On success,
     * it will try to find the local sender by SendGrid id or by email and mark it verified.
     */
    confirmSendGridVerificationByToken(token, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e;
            const key = process.env.SENDGRID_API_KEY;
            if (!key)
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'SendGrid API key not configured');
            if (!token)
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'token is required');
            try {
                const resp = yield axios_1.default.get(`https://api.sendgrid.com/v3/verified_senders/verify/${encodeURIComponent(token)}`, {
                    headers: { Authorization: `Bearer ${key}` }
                });
                let body = resp.data || {};
                // If SendGrid returned an empty body, fall back to listing verified_senders and
                // matching against our local pending senders' emails. Some SendGrid accounts
                // return minimal/empty payload from the verify endpoint.
                if (!body || (typeof body === 'object' && Object.keys(body).length === 0)) {
                    try {
                        const listResp = yield axios_1.default.get('https://api.sendgrid.com/v3/verified_senders', {
                            headers: { Authorization: `Bearer ${key}` }
                        });
                        const listBody = listResp.data || {};
                        const results = Array.isArray(listBody.result) ? listBody.result : (Array.isArray(listBody) ? listBody : listBody.results || []);
                        // Find local pending senders
                        const pendingSenders = yield SenderEmail_1.SenderModel.find({ verified: false, type: 'sendgrid' });
                        let matched = null;
                        for (const entry of results) {
                            // Entry may have from_email or from_email_address depending on API.
                            const entryEmail = entry.from_email || entry.from_email_address || entry.email || entry.from;
                            if (!entryEmail)
                                continue;
                            const match = pendingSenders.find(ps => ps.senderEmail && ps.senderEmail.toLowerCase() === String(entryEmail).toLowerCase());
                            if (match && (entry.status === 'verified' || entry.verified === true || entry.is_verified === true)) {
                                matched = { entry, match };
                                break;
                            }
                        }
                        if (!matched) {
                            throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, `No local sender found matching SendGrid verified senders list for token: ${token}`);
                        }
                        // mark matched local sender as sender
                        body = matched.entry;
                        const matchedSender = matched.match;
                        matchedSender.verified = true;
                        yield matchedSender.save();
                        if (matchedSender.user_id)
                            yield User_1.UserModel.findByIdAndUpdate(matchedSender.user_id, { senderEmail: matchedSender.senderEmail });
                        return matchedSender;
                    }
                    catch (listErr) {
                        // If fallback list check failed, log and surface a helpful message
                        try {
                            const dbg = ((_a = listErr === null || listErr === void 0 ? void 0 : listErr.response) === null || _a === void 0 ? void 0 : _a.data) || ((_b = listErr === null || listErr === void 0 ? void 0 : listErr.response) === null || _b === void 0 ? void 0 : _b.body);
                            if (dbg)
                                console.error('[SenderService] SendGrid verified_senders list error body:', JSON.stringify(dbg));
                        }
                        catch (le) {
                            console.error('[SenderService] Failed to log verified_senders list error body', le);
                        }
                        throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'SendGrid verify returned empty result and verified_senders fallback failed');
                    }
                }
                // Try to find SendGrid id or email in response
                const sgId = (body && (body.id || body._id || body.sender_id || body.id_string));
                const sgEmail = body.from_email || body.email || body.from || body.sender_email;
                let sender = null;
                if (sgId) {
                    sender = yield SenderEmail_1.SenderModel.findOne({ sendgridId: sgId });
                }
                if (!sender && sgEmail) {
                    sender = yield SenderEmail_1.SenderModel.findOne({ senderEmail: sgEmail });
                }
                if (!sender) {
                    // If we couldn't find a local sender record, surface the SendGrid response to help debugging
                    throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, `No local sender found for SendGrid verification result: ${JSON.stringify(body)}`);
                }
                if (userId && sender.user_id && sender.user_id.toString() !== userId) {
                    throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.FORBIDDEN, 'You do not own this sender email');
                }
                sender.verified = true;
                yield sender.save();
                if (sender.user_id) {
                    yield User_1.UserModel.findByIdAndUpdate(sender.user_id, { senderEmail: sender.senderEmail });
                }
                return sender;
            }
            catch (err) {
                if (err instanceof ApiError_1.ApiError)
                    throw err;
                try {
                    const body = ((_c = err === null || err === void 0 ? void 0 : err.response) === null || _c === void 0 ? void 0 : _c.data) || ((_d = err === null || err === void 0 ? void 0 : err.response) === null || _d === void 0 ? void 0 : _d.body);
                    if (body)
                        console.error('[SenderService] SendGrid verify-by-token error body:', JSON.stringify(body));
                }
                catch (logErr) {
                    console.error('[SenderService] Failed to log SendGrid verify-by-token error body:', logErr);
                }
                const msg = ((_e = err === null || err === void 0 ? void 0 : err.response) === null || _e === void 0 ? void 0 : _e.data) || err.message || 'SendGrid verify-by-token failed';
                throw new ApiError_1.ApiError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `SendGrid verify-by-token failed: ${JSON.stringify(msg)}`);
            }
        });
    }
    /**
     * Retrieves the user's verified sender email address.
     * @param userId The user ID.
     * @returns The verified SenderEmailModel for the user, or null if none found.
     */
    getUserVerifiedSender(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const sender = yield SenderEmail_1.SenderModel.findOne({ user_id: userId, verified: true, type: 'sendgrid' });
                return sender || null;
            }
            catch (err) {
                console.error(`[SenderService] Error fetching verified sender for user ${userId}:`, err);
                return null;
            }
        });
    }
}
exports.SenderEmailServiceImpl = SenderEmailServiceImpl;
