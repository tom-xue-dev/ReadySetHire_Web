import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/job-applications/stats', authenticateToken, async (req, res) => {
  try {
    const total = await prisma.jobApplication.count();
    
    const byStatus = await prisma.jobApplication.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });

    const statusCounts: Record<string, number> = {};
    byStatus.forEach(item => {
      statusCounts[item.status] = item._count.status;
    });

    return res.json({
      total,
      byStatus: statusCounts
    });
  } catch (error: any) {
    console.error('Error fetching job application stats:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch stats' });
  }
});

export default router;
