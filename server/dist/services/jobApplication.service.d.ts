type ApplicationStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'SHORTLISTED' | 'INTERVIEW_SCHEDULED' | 'INTERVIEWED' | 'OFFER_EXTENDED' | 'HIRED' | 'REJECTED' | 'WITHDRAWN';
export interface CreateJobApplicationData {
    jobId: number;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    coverLetter?: string;
    linkedinUrl?: string;
    portfolioUrl?: string;
    yearsExperience?: number;
    resumeId?: number;
    source?: string;
}
export interface UpdateApplicationStatusData {
    status: ApplicationStatus;
    notes?: string;
    reviewedBy?: number;
}
export declare class JobApplicationService {
    /**
     * Create a new job application
     */
    createApplication(data: CreateJobApplicationData): Promise<any>;
    /**
     * Get application by tracking token (public access)
     */
    getApplicationByToken(trackingToken: string): Promise<{
        id: any;
        jobTitle: any;
        applicantName: string;
        status: any;
        submittedAt: any;
        lastUpdated: any;
    }>;
    /**
     * Get all applications for a job (recruiter view)
     */
    getApplicationsByJob(jobId: number, filters?: {
        status?: ApplicationStatus;
        search?: string;
    }): Promise<any>;
    /**
     * Get application by ID (full details for recruiter)
     */
    getApplicationById(id: number): Promise<any>;
    /**
     * Update application status
     */
    updateApplicationStatus(id: number, data: UpdateApplicationStatusData): Promise<any>;
    /**
     * Get application statistics for a job
     */
    getJobApplicationStats(jobId: number): Promise<{
        total: any;
        byStatus: Record<string, number>;
    }>;
    /**
     * Delete application
     */
    deleteApplication(id: number): Promise<void>;
    /**
     * Generate unique tracking token
     */
    private generateTrackingToken;
    /**
     * Check for duplicate applications
     */
    checkDuplicateApplication(email: string, jobId: number): Promise<boolean>;
    /**
     * Get all applications (admin view with pagination)
     */
    getAllApplications(params?: {
        page?: number;
        limit?: number;
        status?: ApplicationStatus;
        jobId?: number;
    }): Promise<{
        data: any;
        pagination: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
        };
    }>;
}
export declare const jobApplicationService: JobApplicationService;
export {};
//# sourceMappingURL=jobApplication.service.d.ts.map