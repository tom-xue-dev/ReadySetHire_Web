import { v4 as uuidv4 } from 'uuid';
import prisma from './database';

// Local type to avoid dependency on generated Prisma enum during linting
type ApplicationStatus =
  | 'SUBMITTED'
  | 'IN_REVIEW'
  | 'SHORTLISTED'
  | 'INTERVIEW_SCHEDULED'
  | 'INTERVIEWED'
  | 'OFFER_EXTENDED'
  | 'HIRED'
  | 'REJECTED'
  | 'WITHDRAWN';

export interface CreateJobApplicationData {
  jobId: number;
  candidateId?: number;
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

export class JobApplicationService {
  
  /**
   * Create a new job application
   */
  async createApplication(data: CreateJobApplicationData) {
    try {
      // Verify job exists and is published
      const job = await prisma.job.findUnique({
        where: { id: data.jobId },
      });

      if (!job) {
        throw new Error('Job not found');
      }

      if (job.status !== 'PUBLISHED') {
        throw new Error('This job is not currently accepting applications');
      }

      // Handle candidateId - create or find candidate
      let candidateId = data.candidateId;
      if (!candidateId) {
        // If no candidateId provided, create a candidate with userId from job owner
        const candidate = await prisma.candidate.create({
          data: {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
            userId: job.userId, // Use job owner's userId
          },
        });
        candidateId = candidate.id;
      }

      // Generate unique tracking token
      const trackingToken = this.generateTrackingToken();

      // Create application
      const application = await (prisma as any).jobApplication.create({
        data: {
          jobId: data.jobId,
          candidateId: candidateId,
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

    } catch (error: any) {
      console.error('❌ Failed to create job application:', error);
      throw new Error(`Application submission failed: ${error.message}`);
    }
  }

  /**
   * Get application by tracking token (public access)
   */
  async getApplicationByToken(trackingToken: string) {
    const application = await (prisma as any).jobApplication.findUnique({
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
  async getApplicationsByJob(jobId: number, filters?: {
    status?: ApplicationStatus;
    search?: string;
  }) {
    const where: any = { jobId };

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

    return await (prisma as any).jobApplication.findMany({
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
  async getApplicationById(id: number) {
    return await (prisma as any).jobApplication.findUnique({
      where: { id },
      include: {
        job: true,
        resume: true,
      },
    });
  }

  /**
   * Get applications by email (for employees to view their own applications)
   */
  async getApplicationsByEmail(email: string) {
    return await (prisma as any).jobApplication.findMany({
      where: {
        email: {
          equals: email,
          mode: 'insensitive',
        },
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            location: true,
            description: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Update application status
   */
  async updateApplicationStatus(
    id: number,
    data: UpdateApplicationStatusData
  ) {
    try {
      const updateData: any = {
        status: data.status,
      };

      if (data.notes) {
        updateData.notes = data.notes;
      }

      if (data.reviewedBy) {
        updateData.reviewedBy = data.reviewedBy;
        updateData.reviewedAt = new Date();
      }

      const application = await (prisma as any).jobApplication.update({
        where: { id },
        data: updateData,
        include: {
          job: true,
          resume: true,
        },
      });

      console.log('✅ Application status updated:', id, data.status);
      return application;

    } catch (error: any) {
      console.error('❌ Failed to update application status:', error);
      throw new Error(`Status update failed: ${error.message}`);
    }
  }

  /**
   * Get application statistics for a job
   */
  async getJobApplicationStats(jobId: number) {
    const [total, byStatus] = await Promise.all([
      (prisma as any).jobApplication.count({
        where: { jobId },
      }),
      (prisma as any).jobApplication.groupBy({
        by: ['status'],
        where: { jobId },
        _count: true,
      }),
    ]);

    const stats: Record<string, number> = {};
    (byStatus as any[]).forEach((item: any) => {
      stats[item.status] = item._count as number;
    });

    return {
      total,
      byStatus: stats,
    };
  }

  /**
   * Delete application
   */
  async deleteApplication(id: number) {
    try {
      await (prisma as any).jobApplication.delete({
        where: { id },
      });
      console.log('✅ Application deleted:', id);
    } catch (error: any) {
      console.error('❌ Failed to delete application:', error);
      throw new Error(`Deletion failed: ${error.message}`);
    }
  }

  /**
   * Generate unique tracking token
   */
  private generateTrackingToken(): string {
    return `APP-${uuidv4().toUpperCase().replace(/-/g, '')}`;
  }

  /**
   * Check for duplicate applications
   */
  async checkDuplicateApplication(email: string, jobId: number): Promise<boolean> {
    const existing = await (prisma as any).jobApplication.findFirst({
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
  async getAllApplications(params?: {
    page?: number;
    limit?: number;
    status?: ApplicationStatus;
    jobId?: number;
  }) {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params?.status) {
      where.status = params.status;
    }
    if (params?.jobId) {
      where.jobId = params.jobId;
    }

    const [applications, total] = await Promise.all([
      (prisma as any).jobApplication.findMany({
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
      (prisma as any).jobApplication.count({ where }),
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

export const jobApplicationService = new JobApplicationService();

