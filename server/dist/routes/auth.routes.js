"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Authentication routes
router.post('/auth/login', auth_1.login);
router.post('/auth/register', auth_1.register);
router.get('/auth/profile', auth_1.authenticateToken, auth_1.getProfile);
router.patch('/auth/profile', auth_1.authenticateToken, auth_1.updateProfile);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map