"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobApplicationController = exports.JobApplicationController = exports.upload = void 0;
const jobApplication_service_1 = require("../services/jobApplication.service");
const resume_service_1 = require("../services/resume.service");
const multer_1 = __importDefault(require("multer"));
// Configure multer for file uploads
const storage = multer_1.default.memoryStorage();
exports.upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type. Only PDF and DOC/DOCX are allowed.'));
        }
    },
});
class JobApplicationController {
    /**
     * POST /api/jobs/:jobId/apply
     * Public endpoint for job applications
     */
    async submitApplication(req, res) {
        try {
            const { jobId } = req.params;
            const { firstName, lastName, email, phone, coverLetter, linkedinUrl, portfolioUrl, yearsExperience, } = req.body;
            // Validate required fields
            if (!firstName || !lastName || !email) {
                return res.status(400).json({
                    error: 'Missing required fields: firstName, lastName, email',
                });
            }
            // Check for duplicate application
            const isDuplicate = await jobApplication_service_1.jobApplicationService.checkDuplicateApplication(email, parseInt(jobId));
            if (isDuplicate) {
                return res.status(409).json({
                    error: 'You have already applied to this position',
                });
            }
            // Handle resume upload if provided
            let resumeId;
            if (req.file) {
                const resume = await resume_service_1.resumeService.uploadResume({
                    originalName: req.file.originalname,
                    buffer: req.file.buffer,
                    mimeType: req.file.mimetype,
                    size: req.file.size,
                });
                resumeId = resume.id;
                // Parse resume in background (don't await)
                resume_service_1.resumeService.parseResumeWithLLM(resume.id).catch(err => {
                    console.error('Background resume parsing failed:', err);
                });
            }
            // Create application
            const application = await jobApplication_service_1.jobApplicationService.createApplication({
                jobId: parseInt(jobId),
                firstName,
                lastName,
                email,
                phone,
                coverLetter,
                linkedinUrl,
                portfolioUrl,
                yearsExperience: yearsExperience ? parseInt(yearsExperience) : undefined,
                resumeId,
            });
            // TODO: Send confirmation email
            // await emailService.sendApplicationConfirmation(application);
            return res.status(201).json({
                message: 'Application submitted successfully',
                trackingToken: application.trackingToken,
                application: {
                    id: application.id,
                    jobTitle: application.job.title,
                    status: application.status,
                    submittedAt: application.createdAt,
                },
            });
        }
        catch (error) {
            console.error('❌ Application submission error:', error);
            return res.status(500).json({
                error: 'Failed to submit application',
                details: error.message,
            });
        }
    }
    /**
     * GET /api/applications/track/:token
     * Public endpoint to track application status
     */
    async trackApplication(req, res) {
        try {
            const { token } = req.params;
            const application = await jobApplication_service_1.jobApplicationService.getApplicationByToken(token);
            return res.json({
                success: true,
                application,
            });
        }
        catch (error) {
            console.error('❌ Application tracking error:', error);
            return res.status(404).json({
                error: 'Application not found',
                details: error.message,
            });
        }
    }
    /**
     * GET /api/jobs/:jobId/applications
     * Get all applications for a job (protected - recruiters only)
     */
    async getJobApplications(req, res) {
        try {
            const { jobId } = req.params;
            const { status, search } = req.query;
            const applications = await jobApplication_service_1.jobApplicationService.getApplicationsByJob(parseInt(jobId), {
                status: status,
                search: search,
            });
            return res.json({
                success: true,
                count: applications.length,
                applications,
            });
        }
        catch (error) {
            console.error('❌ Get applications error:', error);
            return res.status(500).json({
                error: 'Failed to fetch applications',
                details: error.message,
            });
        }
    }
    /**
     * GET /api/applications/:id
     * Get single application details (protected)
     */
    async getApplicationById(req, res) {
        try {
            const { id } = req.params;
            const application = await jobApplication_service_1.jobApplicationService.getApplicationById(parseInt(id));
            if (!application) {
                return res.status(404).json({
                    error: 'Application not found',
                });
            }
            return res.json({
                success: true,
                application,
            });
        }
        catch (error) {
            console.error('❌ Get application error:', error);
            return res.status(500).json({
                error: 'Failed to fetch application',
                details: error.message,
            });
        }
    }
    /**
     * PATCH /api/applications/:id/status
     * Update application status (protected)
     */
    async updateApplicationStatus(req, res) {
        try {
            const { id } = req.params;
            const { status, notes } = req.body;
            const userId = req.user?.id;
            if (!status) {
                return res.status(400).json({
                    error: 'Status is required',
                });
            }
            const application = await jobApplication_service_1.jobApplicationService.updateApplicationStatus(parseInt(id), {
                status,
                notes,
                reviewedBy: userId,
            });
            // TODO: Send status update email
            // await emailService.sendStatusUpdate(application);
            return res.json({
                success: true,
                message: 'Application status updated',
                application,
            });
        }
        catch (error) {
            console.error('❌ Update status error:', error);
            return res.status(500).json({
                error: 'Failed to update status',
                details: error.message,
            });
        }
    }
    /**
     * GET /api/jobs/:jobId/applications/stats
     * Get application statistics for a job (protected)
     */
    async getApplicationStats(req, res) {
        try {
            const { jobId } = req.params;
            const stats = await jobApplication_service_1.jobApplicationService.getJobApplicationStats(parseInt(jobId));
            return res.json({
                success: true,
                stats,
            });
        }
        catch (error) {
            console.error('❌ Get stats error:', error);
            return res.status(500).json({
                error: 'Failed to fetch statistics',
                details: error.message,
            });
        }
    }
    /**
     * GET /api/applications
     * Get all applications with pagination (protected - admin/recruiter)
     */
    async getAllApplications(req, res) {
        try {
            const { page, limit, status, jobId } = req.query;
            const result = await jobApplication_service_1.jobApplicationService.getAllApplications({
                page: page ? parseInt(page) : undefined,
                limit: limit ? parseInt(limit) : undefined,
                status: status,
                jobId: jobId ? parseInt(jobId) : undefined,
            });
            return res.json({
                success: true,
                ...result,
            });
        }
        catch (error) {
            console.error('❌ Get all applications error:', error);
            return res.status(500).json({
                error: 'Failed to fetch applications',
                details: error.message,
            });
        }
    }
    /**
     * DELETE /api/applications/:id
     * Delete application (protected - admin only)
     */
    async deleteApplication(req, res) {
        try {
            const { id } = req.params;
            await jobApplication_service_1.jobApplicationService.deleteApplication(parseInt(id));
            return res.json({
                success: true,
                message: 'Application deleted successfully',
            });
        }
        catch (error) {
            console.error('❌ Delete application error:', error);
            return res.status(500).json({
                error: 'Failed to delete application',
                details: error.message,
            });
        }
    }
    /**
     * GET /api/resumes/:id/download
     * Download resume file (protected)
     */
    async downloadResume(req, res) {
        try {
            const { id } = req.params;
            const { buffer, mimeType, originalName } = await resume_service_1.resumeService.getResumeFile(parseInt(id));
            res.setHeader('Content-Type', mimeType);
            res.setHeader('Content-Disposition', `attachment; filename="${originalName}"`);
            res.send(buffer);
        }
        catch (error) {
            console.error('❌ Download resume error:', error);
            return res.status(404).json({
                error: 'Resume not found',
                details: error.message,
            });
        }
    }
}
exports.JobApplicationController = JobApplicationController;
exports.jobApplicationController = new JobApplicationController();
//# sourceMappingURL=jobApplication.controller.js.map