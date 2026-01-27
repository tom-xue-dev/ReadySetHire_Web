import { Request, Response } from 'express';
import multer from 'multer';
export declare const upload: multer.Multer;
export declare class JobApplicationController {
    /**
     * POST /api/jobs/:jobId/apply
     * Public endpoint for job applications
     */
    submitApplication(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * GET /api/applications/track/:token
     * Public endpoint to track application status
     */
    trackApplication(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * GET /api/jobs/:jobId/applications
     * Get all applications for a job (protected - recruiters only)
     */
    getJobApplications(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * GET /api/applications/:id
     * Get single application details (protected)
     */
    getApplicationById(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * PATCH /api/applications/:id/status
     * Update application status (protected)
     */
    updateApplicationStatus(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * GET /api/jobs/:jobId/applications/stats
     * Get application statistics for a job (protected)
     */
    getApplicationStats(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * GET /api/applications
     * Get all applications with pagination (protected - admin/recruiter)
     */
    getAllApplications(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * DELETE /api/applications/:id
     * Delete application (protected - admin only)
     */
    deleteApplication(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * GET /api/resumes/:id/download
     * Download resume file (protected)
     */
    downloadResume(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
export declare const jobApplicationController: JobApplicationController;
//# sourceMappingURL=jobApplication.controller.d.ts.map