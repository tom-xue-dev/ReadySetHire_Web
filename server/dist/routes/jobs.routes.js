"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const controllers_1 = require("../controllers");
const database_1 = require("../services/database");
const router = (0, express_1.Router)();
const jobController = new controllers_1.JobController(database_1.jobService);
router.get('/jobs', auth_1.optionalAuth, jobController.getAll.bind(jobController));
// Get all jobs for tracking page (public access with optional auth for full details)
router.get('/jobs/tracking', auth_1.optionalAuth, jobController.getAll.bind(jobController));
router.get('/jobs/published', jobController.getPublished.bind(jobController));
router.get('/jobs/user/:userId', auth_1.authenticateToken, jobController.getByUserId.bind(jobController));
router.get('/jobs/:id', auth_1.optionalAuth, jobController.getById.bind(jobController));
router.post('/jobs', auth_1.authenticateToken, (0, auth_1.requireRole)(['ADMIN', 'RECRUITER']), jobController.create.bind(jobController));
router.patch('/jobs/:id', auth_1.authenticateToken, (0, auth_1.requireRole)(['ADMIN', 'RECRUITER']), jobController.update.bind(jobController));
router.patch('/jobs/:id/publish', auth_1.authenticateToken, (0, auth_1.requireRole)(['ADMIN', 'RECRUITER']), jobController.publish.bind(jobController));
router.delete('/jobs/:id', auth_1.authenticateToken, (0, auth_1.requireRole)(['ADMIN', 'RECRUITER']), jobController.delete.bind(jobController));
exports.default = router;
//# sourceMappingURL=jobs.routes.js.map