"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/upload.routes.ts
const express_1 = require("express");
const Upload_1 = require("../controllers/Upload");
const Upload_2 = __importDefault(require("../middlewares/Upload"));
const router = (0, express_1.Router)();
// The field name 'image' must match the key in the form-data request.
router.post('/', Upload_2.default.single('image'), Upload_1.uploadImage);
exports.default = router;
