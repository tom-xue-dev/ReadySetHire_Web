import { Router } from 'express';
import { jobApplicationController, upload } from '../controllers/jobApplication.controller';
import { authenticateToken, optionalAuth } from '../middleware/auth';

const router = Router();

/**
 * Public Routes (no authentication required)
 */

// Submit job application (with resume upload)
router.post('/jobs/:jobId/apply',upload.single('resume'),
  jobApplicationController.submitApplication.bind(jobApplicationController)
);

// get application status by token
router.get('/applications/track/:token',
  jobApplicationController.trackApplication.bind(jobApplicationController)
);

// Get my applications by email (for employees to view their own applications)
router.get('/applications/my',
  authenticateToken,
  jobApplicationController.getMyApplications.bind(jobApplicationController)
);

/**
 * Protected Routes (authentication required)
 */

// Get all applications (with pagination and filters)
router.get('/applications',authenticateToken,
  jobApplicationController.getAllApplications.bind(jobApplicationController)
);

// Get applications for specific job
router.get('/jobs/:jobId/applications',authenticateToken,
  jobApplicationController.getJobApplications.bind(jobApplicationController)
);

// Get application statistics for a job
router.get('/jobs/:jobId/applications/stats',authenticateToken,
  jobApplicationController.getApplicationStats.bind(jobApplicationController)
);

// Get single application details
router.get('/applications/:id',authenticateToken,
  jobApplicationController.getApplicationById.bind(jobApplicationController)
);

// Update application status
router.patch(
  '/applications/:id/status',
  authenticateToken,
  jobApplicationController.updateApplicationStatus.bind(jobApplicationController)
);

// Delete application
router.delete(
  '/applications/:id',
  authenticateToken,
  jobApplicationController.deleteApplication.bind(jobApplicationController)
);

// Download resume
router.get(
  '/resumes/:id/download',
  authenticateToken,
  jobApplicationController.downloadResume.bind(jobApplicationController)
);

// Preview resume inline
router.get(
  '/resumes/:id/preview',
  authenticateToken,
  jobApplicationController.previewResume.bind(jobApplicationController)
);

export default router;

