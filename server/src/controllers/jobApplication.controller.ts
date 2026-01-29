import { Request, Response } from 'express';
import { jobApplicationService } from '../services/jobApplication.service';
import { resumeService } from '../services/resume.service';
import multer from 'multer';

// Configure multer for file uploads
const storage = multer.memoryStorage();
export const upload = multer({
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
    } else {
      cb(new Error('Invalid file type. Only PDF and DOC/DOCX are allowed.'));
    }
  },
});

export class JobApplicationController {
  
  /**
   * POST /api/jobs/:jobId/apply
   * Public endpoint for job applications
   */
  async submitApplication(req: Request, res: Response) {
    try {
      const { jobId } = req.params;
      const {
        candidateId,
        firstName,
        lastName,
        email,
        phone,
        coverLetter,
        linkedinUrl,
        portfolioUrl,
        yearsExperience,
      } = req.body;

      // Validate required fields
      if (!firstName || !lastName || !email) {
        return res.status(400).json({
          error: 'Missing required fields: firstName, lastName, email',
        });
      }

      // Check for duplicate application
      const isDuplicate = await jobApplicationService.checkDuplicateApplication(
        email,
        parseInt(jobId)
      );

      if (isDuplicate) {
        return res.status(409).json({
          error: 'You have already applied to this position',
        });
      }

      // Handle resume upload if provided
      let resumeId: number | undefined;
      if (req.file) {
        const resume = await resumeService.uploadResume({
          originalName: req.file.originalname,
          buffer: req.file.buffer,
          mimeType: req.file.mimetype,
          size: req.file.size,
        });
        resumeId = resume.id;

        // Parse resume in background (don't await)
        resumeService.parseResumeWithLLM(resume.id).catch(err => {
          console.error('Background resume parsing failed:', err);
        });
      }

      // Create application
      const application = await jobApplicationService.createApplication({
        jobId: parseInt(jobId),
        candidateId: candidateId ? parseInt(candidateId) : undefined,
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

    } catch (error: any) {
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
  async trackApplication(req: Request, res: Response) {
    try {
      const { token } = req.params;

      const application = await jobApplicationService.getApplicationByToken(token);

      return res.json({
        success: true,
        application,
      });

    } catch (error: any) {
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
  async getJobApplications(req: Request, res: Response) {
    try {
      const { jobId } = req.params;
      const { status, search } = req.query;

      const applications = await jobApplicationService.getApplicationsByJob(
        parseInt(jobId),
        {
          status: status as any,
          search: search as string,
        }
      );

      return res.json({
        success: true,
        count: applications.length,
        applications,
      });

    } catch (error: any) {
      console.error('❌ Get applications error:', error);
      return res.status(500).json({
        error: 'Failed to fetch applications',
        details: error.message,
      });
    }
  }

  /**
   * GET /api/applications/my
   * Get applications for the current user by email (protected)
   */
  async getMyApplications(req: Request, res: Response) {
    try {
      const { email } = req.query;

      if (!email || typeof email !== 'string') {
        return res.status(400).json({
          error: 'Email is required',
        });
      }

      const applications = await jobApplicationService.getApplicationsByEmail(email);

      return res.json({
        success: true,
        count: applications.length,
        applications,
      });

    } catch (error: any) {
      console.error('❌ Get my applications error:', error);
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
  async getApplicationById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const application = await jobApplicationService.getApplicationById(
        parseInt(id)
      );

      if (!application) {
        return res.status(404).json({
          error: 'Application not found',
        });
      }

      return res.json({
        success: true,
        application,
      });

    } catch (error: any) {
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
  async updateApplicationStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      const userId = (req as any).user?.id;

      if (!status) {
        return res.status(400).json({
          error: 'Status is required',
        });
      }

      const application = await jobApplicationService.updateApplicationStatus(
        parseInt(id),
        {
          status,
          notes,
          reviewedBy: userId,
        }
      );

      // TODO: Send status update email
      // await emailService.sendStatusUpdate(application);

      return res.json({
        success: true,
        message: 'Application status updated',
        application,
      });

    } catch (error: any) {
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
  async getApplicationStats(req: Request, res: Response) {
    try {
      const { jobId } = req.params;

      const stats = await jobApplicationService.getJobApplicationStats(
        parseInt(jobId)
      );

      return res.json({
        success: true,
        stats,
      });

    } catch (error: any) {
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
  async getAllApplications(req: Request, res: Response) {
    try {
      const { page, limit, status, jobId } = req.query;

      const result = await jobApplicationService.getAllApplications({
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        status: status as any,
        jobId: jobId ? parseInt(jobId as string) : undefined,
      });

      return res.json({
        success: true,
        ...result,
      });

    } catch (error: any) {
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
  async deleteApplication(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await jobApplicationService.deleteApplication(parseInt(id));

      return res.json({
        success: true,
        message: 'Application deleted successfully',
      });

    } catch (error: any) {
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
  async downloadResume(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const { buffer, mimeType, originalName } = await resumeService.getResumeFile(
        parseInt(id)
      );

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${originalName}"`);
      res.send(buffer);

    } catch (error: any) {
      console.error('❌ Download resume error:', error);
      return res.status(404).json({
        error: 'Resume not found',
        details: error.message,
      });
    }
  }

  /**
   * GET /api/resumes/:id/preview
   * Preview resume file inline (protected)
   */
  async previewResume(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const { buffer, mimeType, originalName } = await resumeService.getResumeFile(
        parseInt(id)
      );

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${originalName}"`);
      res.send(buffer);

    } catch (error: any) {
      console.error('❌ Preview resume error:', error);
      return res.status(404).json({
        error: 'Resume not found',
        details: error.message,
      });
    }
  }
}

export const jobApplicationController = new JobApplicationController();

