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
exports.authService = void 0;
// MOCK DATABASE - In a real app, use a proper database (e.g., PostgreSQL, MongoDB)
const users = [];
const passwordResets = new Map();
// This service contains business logic for authentication.
// It's a placeholder and should be replaced with actual database interactions.
exports.authService = {
    findUserByEmail: (email) => __awaiter(void 0, void 0, void 0, function* () { return users.find(u => u.email === email); }),
    findUserById: (id) => __awaiter(void 0, void 0, void 0, function* () { return users.find(u => u.id === id); }),
    findUserByWalletAddress: (address) => __awaiter(void 0, void 0, void 0, function* () { return users.find(u => u.walletAddress && u.walletAddress.toLowerCase() === address.toLowerCase()); }),
    createUser: (userData) => __awaiter(void 0, void 0, void 0, function* () {
        const newUser = Object.assign(Object.assign({ id: Date.now().toString() }, userData), { createdAt: new Date(), updatedAt: new Date() });
        users.push(newUser);
        console.log("Users in DB:", users);
        return newUser;
    }),
    updateUser: (id, updateData) => __awaiter(void 0, void 0, void 0, function* () {
        const userIndex = users.findIndex(u => u.id === id);
        if (userIndex === -1)
            return null;
        users[userIndex] = Object.assign(Object.assign(Object.assign({}, users[userIndex]), updateData), { updatedAt: new Date() });
        return users[userIndex];
    }),
    createPasswordResetOTP: (email, otp) => {
        const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        passwordResets.set(email, { otp, expires });
        console.log(`OTP for ${email}: ${otp}`); // For debugging
    },
    verifyPasswordResetOTP: (email, otp) => {
        const resetData = passwordResets.get(email);
        if (!resetData || resetData.otp !== otp || resetData.expires < new Date()) {
            return false;
        }
        return true;
    },
    clearPasswordResetOTP: (email) => {
        passwordResets.delete(email);
    }
};
