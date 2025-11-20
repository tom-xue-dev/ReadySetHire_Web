import { Router } from 'express';
import { authenticateToken, login, register, getProfile, updateProfile } from '../middleware/auth';

const router = Router();

// Authentication routes
router.post('/auth/login', login);
router.post('/auth/register', register);
router.get('/auth/profile', authenticateToken, getProfile);
router.patch('/auth/profile', authenticateToken, updateProfile);

export default router;


