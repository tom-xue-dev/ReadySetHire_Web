import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { ApplicantController } from '../controllers';
import { applicantService } from '../services/database';

const router = Router();
const applicantController = new ApplicantController(applicantService);

router.get('/applicants', authenticateToken, applicantController.getAll.bind(applicantController));
router.get('/applicants/:id', authenticateToken, applicantController.getById.bind(applicantController));
router.post('/applicants', authenticateToken, requireRole(['ADMIN', 'RECRUITER']), applicantController.create.bind(applicantController));
router.patch('/applicants/:id', authenticateToken, requireRole(['ADMIN', 'RECRUITER']), applicantController.update.bind(applicantController));
router.delete('/applicants/:id', authenticateToken, requireRole(['ADMIN', 'RECRUITER']), applicantController.delete.bind(applicantController));

// Interview ↔ Applicant bindings
router.get('/interviews/:interviewId/applicants', authenticateToken, applicantController.getByInterviewId.bind(applicantController));
router.delete('/interviews/:interviewId/applicants/:applicantId', authenticateToken, requireRole(['ADMIN','RECRUITER']), async (req, res) => {
  (req as any).query.interviewId = req.params.interviewId;
  return applicantController.unbindFromInterview(req as any, res);
});
router.patch('/interviews/:interviewId/applicants/:applicantId', authenticateToken, async (req, res) => {
  const status = (req.body && (req.body.status || req.body.interviewStatus));
  (req as any).body = { interviewId: Number(req.params.interviewId), status };
  return applicantController.updateInterviewStatus(req as any, res);
});
router.post('/interviews/:interviewId/applicants', authenticateToken, requireRole(['ADMIN','RECRUITER']), async (req, res) => {
  const interviewId = parseInt(req.params.interviewId);
  const applicantIdRaw = (req.body && (req.body.applicant_id ?? req.body.applicantId));
  const status = (req.body && (req.body.status)) || 'NOT_STARTED';
  if (isNaN(interviewId)) {
    return res.status(400).json({ error: 'Invalid interview ID format' });
  }
  const applicantId = Number(applicantIdRaw);
  if (isNaN(applicantId)) {
    return res.status(400).json({ error: 'Invalid applicant ID format' });
  }
  (req as any).params.applicantId = String(applicantId);
  (req as any).body = { interviewId, status };
  return applicantController.bindToInterview(req as any, res);
});

export default router;


