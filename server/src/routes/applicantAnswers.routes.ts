import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { ApplicantAnswerController } from '../controllers';
import { applicantAnswerService } from '../services/database';

const router = Router();
const applicantAnswerController = new ApplicantAnswerController(applicantAnswerService);

router.get('/applicant_answers', authenticateToken, applicantAnswerController.getAll.bind(applicantAnswerController));
router.get('/applicant_answers/applicant/:applicantId', authenticateToken, applicantAnswerController.getByApplicantId.bind(applicantAnswerController));
router.get('/applicant_answers/question/:questionId', authenticateToken, applicantAnswerController.getByQuestionId.bind(applicantAnswerController));
router.get('/applicant_answers/interview/:interviewId', authenticateToken, applicantAnswerController.getByInterviewId.bind(applicantAnswerController));
router.get('/applicant_answers/interview/:interviewId/applicant/:applicantId', authenticateToken, applicantAnswerController.getByInterviewAndApplicant.bind(applicantAnswerController));
router.get('/applicant_answers/:id', authenticateToken, applicantAnswerController.getById.bind(applicantAnswerController));
router.get('/applicant_answers/:id/details', authenticateToken, applicantAnswerController.getWithDetails.bind(applicantAnswerController));
router.post('/applicant_answers', authenticateToken, applicantAnswerController.create.bind(applicantAnswerController));
router.patch('/applicant_answers/:id', authenticateToken, applicantAnswerController.update.bind(applicantAnswerController));
router.delete('/applicant_answers/:id', authenticateToken, requireRole(['ADMIN']), applicantAnswerController.delete.bind(applicantAnswerController));

export default router;


