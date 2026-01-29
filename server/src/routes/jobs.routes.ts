import { Router } from 'express';
import { authenticateToken, optionalAuth, requireRole } from '../middleware/auth';
import { JobController } from '../controllers';
import { jobService } from '../services/database';

const router = Router();
const jobController = new JobController(jobService);

router.get('/jobs', optionalAuth, jobController.getAll.bind(jobController));
// Get all jobs for tracking page (public access with optional auth for full details)
router.get('/jobs/tracking', optionalAuth, jobController.getAll.bind(jobController));
router.get('/jobs/published', jobController.getPublished.bind(jobController));
router.get('/jobs/user/:userId', authenticateToken, jobController.getByUserId.bind(jobController));
router.get('/jobs/:id', optionalAuth, jobController.getById.bind(jobController));
router.post('/jobs', authenticateToken, requireRole(['ADMIN', 'RECRUITER']), jobController.create.bind(jobController));
router.patch('/jobs/:id', authenticateToken, requireRole(['ADMIN', 'RECRUITER']), jobController.update.bind(jobController));
router.patch('/jobs/:id/publish', authenticateToken, requireRole(['ADMIN', 'RECRUITER']), jobController.publish.bind(jobController));
router.patch('/jobs/:id/close', authenticateToken, requireRole(['ADMIN', 'RECRUITER']), jobController.close.bind(jobController));
router.delete('/jobs/:id', authenticateToken, requireRole(['ADMIN', 'RECRUITER']), jobController.delete.bind(jobController));

export default router;


