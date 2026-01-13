"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormModel = exports.FieldType = void 0;
const mongoose_1 = require("mongoose");
var FieldType;
(function (FieldType) {
    FieldType["TEXT"] = "text";
    FieldType["EMAIL"] = "email";
    FieldType["PHONE"] = "phone";
    FieldType["DROPDOWN"] = "dropdown";
    FieldType["CHECKBOX"] = "checkbox";
    FieldType["MULTI_SELECT"] = "multi-select";
    FieldType["PARAGRAPH"] = "paragraph";
})(FieldType || (exports.FieldType = FieldType = {}));
const FormSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    fields: [
        {
            type: { type: String, enum: Object.values(FieldType), required: true },
            label: { type: String, required: true },
            placeholder: { type: String },
            required: { type: Boolean, default: false },
            options: [{ type: String }],
        },
    ],
    isActive: { type: Boolean, default: true },
    submissionCount: { type: Number, default: 0 },
}, { timestamps: true });
exports.FormModel = (0, mongoose_1.model)("Form", FormSchema);
