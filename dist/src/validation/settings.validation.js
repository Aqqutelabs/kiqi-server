"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsSchema = void 0;
const zod_1 = require("zod");
exports.settingsSchema = zod_1.z.object({
    altText: zod_1.z.string().max(500).optional(),
    dailySendLimit: zod_1.z.number().int().nonnegative().optional(),
    batchSendingTime: zod_1.z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(), // HH:MM
    emailCompliance: zod_1.z.object({
        includeSubscribedLink: zod_1.z.boolean().optional(),
        includePermissionReminder: zod_1.z.boolean().optional(),
    }).optional()
});
