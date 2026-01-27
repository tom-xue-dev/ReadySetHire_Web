"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobApplicationService = exports.JobApplicationService = void 0;
const uuid_1 = require("uuid");
const database_1 = __importDefault(require("./database"));
class JobApplicationService {
    /**
     * Create a new job application
     */
    async createApplication(data) {
        try {
            // Verify job exists and is published
            const job = await database_1.default.job.findUnique({
                where: { id: data.jobId },
            });
            if (!job) {
                throw new Error('Job not found');
            }
            if (job.status !== 'PUBLISHED') {
                throw new Error('This job is not currently accepting applications');
            }
            // Generate unique tracking token
            const trackingToken = this.generateTrackingToken();
            // Create application
            const application = await database_1.default.jobApplication.create({
                data: {
                    jobId: data.jobId,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    email: data.email,
                    phone: data.phone,
                    coverLetter: data.coverLetter,
                    linkedinUrl: data.linkedinUrl,
                    portfolioUrl: data.portfolioUrl,
                    yearsExperience: data.yearsExperience,
                    resumeId: data.resumeId,
                    trackingToken: trackingToken,
                    source: data.source || 'website',
                    status: 'SUBMITTED',
                },
                include: {
                    job: {
                        select: {
                            id: true,
                            title: true,
                            location: true,
                        },
                    },
                    resume: true,
                },
            });
            console.log('✅ Job application created:', application.id);
            return application;
        }
        catch (error) {
            console.error('❌ Failed to create job application:', error);
            throw new Error(`Application submission failed: ${error.message}`);
        }
    }
    /**
     * Get application by tracking token (public access)
     */
    async getApplicationByToken(trackingToken) {
        const application = await database_1.default.jobApplication.findUnique({
            where: { trackingToken },
            include: {
                job: {
                    select: {
                        id: true,
                        title: true,
                        location: true,
                        description: true,
                    },
                },
                resume: {
                    select: {
                        id: true,
                        originalName: true,
                        fileSize: true,
                        uploadedAt: true,
                    },
                },
            },
        });
        if (!application) {
            throw new Error('Application not found');
        }
        // Return only public information
        return {
            id: application.id,
            jobTitle: application.job.title,
            applicantName: `${application.firstName} ${application.lastName}`,
            status: application.status,
            submittedAt: application.createdAt,
            lastUpdated: application.updatedAt,
        };
    }
    /**
     * Get all applications for a job (recruiter view)
     */
    async getApplicationsByJob(jobId, filters) {
        const where = { jobId };
        if (filters?.status) {
            where.status = filters.status;
        }
        if (filters?.search) {
            where.OR = [
                { firstName: { contains: filters.search, mode: 'insensitive' } },
                { lastName: { contains: filters.search, mode: 'insensitive' } },
                { email: { contains: filters.search, mode: 'insensitive' } },
            ];
        }
        return await database_1.default.jobApplication.findMany({
            where,
            include: {
                resume: {
                    select: {
                        id: true,
                        originalName: true,
                        fileSize: true,
                        uploadedAt: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
    /**
     * Get application by ID (full details for recruiter)
     */
    async getApplicationById(id) {
        return await database_1.default.jobApplication.findUnique({
            where: { id },
            include: {
                job: true,
                resume: true,
            },
        });
    }
    /**
     * Update application status
     */
    async updateApplicationStatus(id, data) {
        try {
            const updateData = {
                status: data.status,
            };
            if (data.notes) {
                updateData.notes = data.notes;
            }
            if (data.reviewedBy) {
                updateData.reviewedBy = data.reviewedBy;
                updateData.reviewedAt = new Date();
            }
            const application = await database_1.default.jobApplication.update({
                where: { id },
                data: updateData,
                include: {
                    job: true,
                    resume: true,
                },
            });
            console.log('✅ Application status updated:', id, data.status);
            return application;
        }
        catch (error) {
            console.error('❌ Failed to update application status:', error);
            throw new Error(`Status update failed: ${error.message}`);
        }
    }
    /**
     * Get application statistics for a job
     */
    async getJobApplicationStats(jobId) {
        const [total, byStatus] = await Promise.all([
            database_1.default.jobApplication.count({
                where: { jobId },
            }),
            database_1.default.jobApplication.groupBy({
                by: ['status'],
                where: { jobId },
                _count: true,
            }),
        ]);
        const stats = {};
        byStatus.forEach((item) => {
            stats[item.status] = item._count;
        });
        return {
            total,
            byStatus: stats,
        };
    }
    /**
     * Delete application
     */
    async deleteApplication(id) {
        try {
            await database_1.default.jobApplication.delete({
                where: { id },
            });
            console.log('✅ Application deleted:', id);
        }
        catch (error) {
            console.error('❌ Failed to delete application:', error);
            throw new Error(`Deletion failed: ${error.message}`);
        }
    }
    /**
     * Generate unique tracking token
     */
    generateTrackingToken() {
        return `APP-${(0, uuid_1.v4)().toUpperCase().replace(/-/g, '')}`;
    }
    /**
     * Check for duplicate applications
     */
    async checkDuplicateApplication(email, jobId) {
        const existing = await database_1.default.jobApplication.findFirst({
            where: {
                email,
                jobId,
                status: {
                    notIn: ['REJECTED', 'WITHDRAWN'], // Allow re-application if previously rejected
                },
            },
        });
        return !!existing;
    }
    /**
     * Get all applications (admin view with pagination)
     */
    async getAllApplications(params) {
        const page = params?.page || 1;
        const limit = params?.limit || 20;
        const skip = (page - 1) * limit;
        const where = {};
        if (params?.status) {
            where.status = params.status;
        }
        if (params?.jobId) {
            where.jobId = params.jobId;
        }
        const [applications, total] = await Promise.all([
            database_1.default.jobApplication.findMany({
                where,
                skip,
                take: limit,
                include: {
                    job: {
                        select: {
                            id: true,
                            title: true,
                            location: true,
                        },
                    },
                    resume: {
                        select: {
                            id: true,
                            originalName: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            database_1.default.jobApplication.count({ where }),
        ]);
        return {
            data: applications,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}
exports.JobApplicationService = JobApplicationService;
exports.jobApplicationService = new JobApplicationService();
//# sourceMappingURL=jobApplication.service.js.map