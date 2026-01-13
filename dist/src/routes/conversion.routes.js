"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Auth_middlewares_1 = require("../middlewares/Auth.middlewares");
const conversion_controller_1 = require("../controllers/conversion.controller");
const router = (0, express_1.Router)();
// Protect all conversion routes
router.use(Auth_middlewares_1.verifyJWT);
// User endpoints
router.post('/', conversion_controller_1.conversionController.createRequest);
router.get('/', conversion_controller_1.conversionController.listUser);
// Admin endpoints (simple role checks in controller)
router.get('/admin/all', conversion_controller_1.conversionController.listAll);
router.post('/admin/:id/approve', conversion_controller_1.conversionController.approve);
router.post('/admin/:id/reject', conversion_controller_1.conversionController.reject);
exports.default = router;
