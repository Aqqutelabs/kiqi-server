"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormSubmissionModel = void 0;
const mongoose_1 = require("mongoose");
const FormSubmissionSchema = new mongoose_1.Schema({
    formId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Form", required: true, index: true },
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    contactId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Contact", required: true },
    data: { type: mongoose_1.Schema.Types.Mixed, required: true },
}, { timestamps: true });
exports.FormSubmissionModel = (0, mongoose_1.model)("FormSubmission", FormSubmissionSchema);
