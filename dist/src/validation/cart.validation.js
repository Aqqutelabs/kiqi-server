"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeFromCartSchema = exports.updateCartItemSchema = exports.addToCartSchema = void 0;
const zod_1 = require("zod");
exports.addToCartSchema = zod_1.z.object({
    body: zod_1.z.object({
        publisherId: zod_1.z.string().nonempty('Publisher ID is required')
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
