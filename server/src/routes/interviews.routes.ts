import { Router } from 'express';
import { authenticateToken, optionalAuth, requireRole } from '../middleware/auth';
import { InterviewController } from '../controllers';
import { interviewService } from '../services/database';

const router = Router();
const interviewController = new InterviewController(interviewService);

router.get('/interviews', optionalAuth, interviewController.getAll.bind(interviewController));
router.get('/interviews/:id', optionalAuth, interviewController.getById.bind(interviewController));
router.post('/interviews', authenticateToken, requireRole(['ADMIN', 'RECRUITER', 'INTERVIEWER']), interviewController.create.bind(interviewController));
router.patch('/interviews/:id', authenticateToken, requireRole(['ADMIN', 'RECRUITER', 'INTERVIEWER']), interviewController.update.bind(interviewController));
router.delete('/interviews/:id', authenticateToken, requireRole(['ADMIN', 'RECRUITER']), interviewController.delete.bind(interviewController));

export default router;


