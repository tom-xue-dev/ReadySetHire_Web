import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /employees/:employeeId/saved-jobs
 * Get all saved jobs for an employee
 */
router.get('/employees/:employeeId/saved-jobs', authenticateToken, async (req, res) => {
  try {
    const employeeId = parseInt(req.params.employeeId);
    const userId = req.user?.id;

    // Ensure user can only access their own saved jobs (or admin can access any)
    if (req.user?.role !== 'ADMIN' && userId !== employeeId) {
      return res.status(403).json({ error: 'Forbidden: You can only access your own saved jobs' });
    }

    const savedJobs = await prisma.savedJob.findMany({
      where: {
        userId: employeeId
      },
      include: {
        job: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.json({
      data: savedJobs.map(saved => ({
        id: saved.id,
        savedAt: saved.createdAt,
        job: saved.job
      }))
    });
  } catch (error: any) {
    console.error('Error fetching saved jobs:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch saved jobs' });
  }
});

/**
 * PUT /employees/:employeeId/saved-jobs/:jobId
 * Save a job for an employee
 */
router.put('/employees/:employeeId/saved-jobs/:jobId', authenticateToken, async (req, res) => {
  try {
    const employeeId = parseInt(req.params.employeeId);
    const jobId = parseInt(req.params.jobId);
    const userId = req.user?.id;

    // Ensure user can only save jobs for themselves (or admin can save for any)
    if (req.user?.role !== 'ADMIN' && userId !== employeeId) {
      return res.status(403).json({ error: 'Forbidden: You can only save jobs for yourself' });
    }

    // Check if job exists
    const job = await prisma.job.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if already saved
    const existing = await prisma.savedJob.findUnique({
      where: {
        userId_jobId: {
          userId: employeeId,
          jobId: jobId
        }
      }
    });

    if (existing) {
      return res.json({
        message: 'Job already saved',
        data: existing
      });
    }

    // Create saved job
    const savedJob = await prisma.savedJob.create({
      data: {
        userId: employeeId,
        jobId: jobId
      },
      include: {
        job: true
      }
    });

    return res.status(201).json({
      message: 'Job saved successfully',
      data: savedJob
    });
  } catch (error: any) {
    console.error('Error saving job:', error);
    return res.status(500).json({ error: error.message || 'Failed to save job' });
  }
});

/**
 * DELETE /employees/:employeeId/saved-jobs/:jobId
 * Remove a saved job for an employee
 */
router.delete('/employees/:employeeId/saved-jobs/:jobId', authenticateToken, async (req, res) => {
  try {
    const employeeId = parseInt(req.params.employeeId);
    const jobId = parseInt(req.params.jobId);
    const userId = req.user?.id;

    // Ensure user can only delete their own saved jobs (or admin can delete any)
    if (req.user?.role !== 'ADMIN' && userId !== employeeId) {
      return res.status(403).json({ error: 'Forbidden: You can only delete your own saved jobs' });
    }

    // Check if saved job exists
    const savedJob = await prisma.savedJob.findUnique({
      where: {
        userId_jobId: {
          userId: employeeId,
          jobId: jobId
        }
      }
    });

    if (!savedJob) {
      return res.status(404).json({ error: 'Saved job not found' });
    }

    // Delete saved job
    await prisma.savedJob.delete({
      where: {
        id: savedJob.id
      }
    });

    return res.json({
      message: 'Saved job removed successfully'
    });
  } catch (error: any) {
    console.error('Error removing saved job:', error);
    return res.status(500).json({ error: error.message || 'Failed to remove saved job' });
  }
});

export default router;
