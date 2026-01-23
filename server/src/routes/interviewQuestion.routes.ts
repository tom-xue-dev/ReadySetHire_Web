import { Router } from 'express';
import { authenticateToken, optionalAuth, requireRole, login, register, getProfile, updateProfile } from '../middleware/auth';
import {QuestionController } from '../controllers';
import { llmService } from '../services/llm';
import { questionService } from '../services/database';
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

