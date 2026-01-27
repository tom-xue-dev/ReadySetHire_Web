"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jobApplication_controller_1 = require("../controllers/jobApplication.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
/**
 * Public Routes (no authentication required)
 */
// Submit job application (with resume upload)
router.post('/jobs/:jobId/apply', jobApplication_controller_1.upload.single('resume'), jobApplication_controller_1.jobApplicationController.submitApplication.bind(jobApplication_controller_1.jobApplicationController));
// get application status by token
router.get('/applications/track/:token', jobApplication_controller_1.jobApplicationController.trackApplication.bind(jobApplication_controller_1.jobApplicationController));
/**
 * Protected Routes (authentication required)
 */
// Get all applications (with pagination and filters)
router.get('/applications', auth_1.authenticateToken, jobApplication_controller_1.jobApplicationController.getAllApplications.bind(jobApplication_controller_1.jobApplicationController));
// Get applications for specific job
router.get('/jobs/:jobId/applications', auth_1.authenticateToken, jobApplication_controller_1.jobApplicationController.getJobApplications.bind(jobApplication_controller_1.jobApplicationController));
// Get application statistics for a job
router.get('/jobs/:jobId/applications/stats', auth_1.authenticateToken, jobApplication_controller_1.jobApplicationController.getApplicationStats.bind(jobApplication_controller_1.jobApplicationController));
// Get single application details
router.get('/applications/:id', auth_1.authenticateToken, jobApplication_controller_1.jobApplicationController.getApplicationById.bind(jobApplication_controller_1.jobApplicationController));
// Update application status
router.patch('/applications/:id/status', auth_1.authenticateToken, jobApplication_controller_1.jobApplicationController.updateApplicationStatus.bind(jobApplication_controller_1.jobApplicationController));
// Delete application
router.delete('/applications/:id', auth_1.authenticateToken, jobApplication_controller_1.jobApplicationController.deleteApplication.bind(jobApplication_controller_1.jobApplicationController));
// Download resume
router.get('/resumes/:id/download', auth_1.authenticateToken, jobApplication_controller_1.jobApplicationController.downloadResume.bind(jobApplication_controller_1.jobApplicationController));
exports.default = router;
//# sourceMappingURL=jobApplication.routes.js.map