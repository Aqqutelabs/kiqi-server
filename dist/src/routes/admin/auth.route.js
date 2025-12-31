"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminAuth_controller_1 = require("../../controllers/admin/adminAuth.controller");
const router = (0, express_1.Router)();
router.post("/login", adminAuth_controller_1.adminLogin);
router.post("/logout", adminAuth_controller_1.adminLogout);
exports.default = router;
