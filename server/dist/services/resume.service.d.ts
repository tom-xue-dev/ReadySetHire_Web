export interface ResumeUpload {
    originalName: string;
    buffer: Buffer;
    mimeType: string;
    size: number;
}
export interface ParsedResumeData {
    skills?: string[];
    experience?: Array<{
        company: string;
        position: string;
        duration?: string;
    }>;
    education?: Array<{
        institution: string;
        degree?: string;
        year?: string;
    }>;
    summary?: string;
}
export declare class ResumeService {
    private uploadDir;
    constructor();
    private ensureUploadDirectory;
    /**
     * Save resume file to disk and create database record
     */
    uploadResume(file: ResumeUpload): Promise<any>;
    /**
     * Extract text from PDF file
     */
    private extractTextFromPDF;
    /**
     * Parse resume data using LLM
     */
    parseResumeWithLLM(resumeId: number): Promise<ParsedResumeData | null>;
    /**
     * Get resume by ID
     */
    getResume(id: number): Promise<({
        applications: ({
            job: {
                id: number;
                companyId: number | null;
                createdAt: Date;
                updatedAt: Date;
                title: string;
                description: string;
                requirements: string | null;
                location: string | null;
                salaryRange: string | null;
                status: import(".prisma/client").$Enums.JobStatus;
                userId: number;
                publishedAt: Date | null;
            };
        } & {
            id: number;
            email: string;
            firstName: string;
            lastName: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.ApplicationStatus;
            phone: string | null;
            jobId: number;
            candidateId: number;
            coverLetter: string | null;
            linkedinUrl: string | null;
            portfolioUrl: string | null;
            yearsExperience: number | null;
            resumeId: number | null;
            trackingToken: string;
            source: string | null;
            notes: string | null;
            reviewedBy: number | null;
            reviewedAt: Date | null;
        })[];
    } & {
        id: number;
        originalName: string;
        fileName: string;
        filePath: string;
        fileSize: number;
        mimeType: string;
        extractedText: string | null;
        parsedData: import("@prisma/client/runtime/library").JsonValue | null;
        uploadedAt: Date;
    }) | null>;
    /**
     * Delete resume file and record
     */
    deleteResume(id: number): Promise<void>;
    /**
     * Get resume file content
     */
    getResumeFile(id: number): Promise<{
        buffer: Buffer;
        mimeType: string;
        originalName: string;
    }>;
}
export declare const resumeService: ResumeService;
//# sourceMappingURL=resume.service.d.ts.map