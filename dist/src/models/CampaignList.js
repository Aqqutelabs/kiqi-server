"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListModel = void 0;
const mongoose_1 = require("mongoose");
const ListSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    contacts: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "CampaignContact" }],
}, { timestamps: true });
exports.ListModel = (0, mongoose_1.model)("List", ListSchema);
