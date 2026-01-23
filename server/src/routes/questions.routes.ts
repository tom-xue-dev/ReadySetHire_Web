import { Router } from 'express';
import { authenticateToken, optionalAuth, requireRole } from '../middleware/auth';
import { QuestionController } from '../controllers';
import { questionService } from '../services/database';
import { llmService } from '../services/llm';

const router = Router();
const questionController = new QuestionController(questionService, llmService);

router.get('/question', optionalAuth, questionController.getAll.bind(questionController));
router.get('/question/interview/:interviewId', optionalAuth, questionController.getByInterviewId.bind(questionController));
router.post('/question/generate/:interviewId', authenticateToken, questionController.generateQuestions.bind(questionController));
router.get('/question/difficulty/:difficulty', optionalAuth, questionController.getByDifficulty.bind(questionController));
router.get('/question/:id', optionalAuth, questionController.getById.bind(questionController));
router.post('/question', authenticateToken, requireRole(['ADMIN', 'RECRUITER', 'EMPLOYEE']), questionController.create.bind(questionController));
router.patch('/question/:id', authenticateToken, requireRole(['ADMIN', 'RECRUITER', 'EMPLOYEE']), questionController.update.bind(questionController));
router.delete('/question/:id', authenticateToken, requireRole(['ADMIN','RECRUITER']), questionController.delete.bind(questionController));

export default router;


