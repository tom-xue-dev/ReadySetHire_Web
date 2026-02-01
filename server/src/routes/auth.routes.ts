import { Router } from 'express';
import { authenticateToken, login, register, getProfile, updateProfile, uploadProfileResume } from '../middleware/auth';
import multer from 'multer';

const router = Router();

// Configure multer for resume upload
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
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

// Authentication routes
router.post('/auth/login', login);
router.post('/auth/register', register);
router.get('/auth/profile', authenticateToken, getProfile);
router.patch('/auth/profile', authenticateToken, updateProfile);
router.post('/auth/profile/resume', authenticateToken, upload.single('resume'), uploadProfileResume);

export default router;


