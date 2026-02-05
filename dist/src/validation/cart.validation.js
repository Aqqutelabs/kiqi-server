"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeFromCartSchema = exports.updateCartItemSchema = exports.addToCartSchema = void 0;
const zod_1 = require("zod");
exports.addToCartSchema = zod_1.z.object({
    body: zod_1.z.object({
        publisherId: zod_1.z.string().nonempty('Publisher ID is required'),
        addons: zod_1.z.array(zod_1.z.object({
            id: zod_1.z.string(),
            name: zod_1.z.string(),
            price: zod_1.z.number(),
            type: zod_1.z.string()
        })).optional(),
        selectedAddons: zod_1.z.array(zod_1.z.object({
            id: zod_1.z.string(),
            name: zod_1.z.string(),
            price: zod_1.z.number(),
            type: zod_1.z.string()
        })).optional(),
        totalPrice: zod_1.z.number().optional()
    })
});
exports.updateCartItemSchema = zod_1.z.object({
    body: zod_1.z.object({
        selected: zod_1.z.boolean()
    })
});
exports.removeFromCartSchema = zod_1.z.object({
    params: zod_1.z.object({
        publisherId: zod_1.z.string().nonempty('Publisher ID is required')
    })
});
