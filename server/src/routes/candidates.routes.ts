import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/candidates', authenticateToken, async (req, res) => {
  try {
    const candidates = await prisma.candidate.findMany({
      where: {
        userId: req.user?.id
      },
      include: {
        _count: {
          select: {
            applications: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.json({
      data: candidates
    });
  } catch (error: any) {
    console.error('Error fetching candidates:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch candidates' });
  }
});

router.post('/candidates', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, email, phone } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if candidate already exists for this user
    const existingCandidate = await prisma.candidate.findFirst({
      where: {
        email,
        userId: req.user?.id!
      }
    });

    if (existingCandidate) {
      return res.status(200).json({ data: existingCandidate });
    }

    const candidate = await prisma.candidate.create({
      data: {
        firstName: firstName || null,
        lastName: lastName || null,
        email,
        phone: phone || null,
        userId: req.user?.id!
      }
    });

    return res.status(201).json({ data: candidate });
  } catch (error: any) {
    console.error('Error creating candidate:', error);
    
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Candidate with this email already exists' });
    }
    
    return res.status(500).json({ error: error.message || 'Failed to create candidate' });
  }
});

router.patch('/candidates/:id', authenticateToken, async (req, res) => {
  try {
    const candidateId = parseInt(req.params.id);
    const { firstName, lastName, email, phone } = req.body;

    const candidate = await prisma.candidate.update({
      where: {
        id: candidateId
      },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone })
      }
    });

    return res.json(candidate);
  } catch (error: any) {
    console.error('Error updating candidate:', error);
    return res.status(500).json({ error: error.message || 'Failed to update candidate' });
  }
});

router.delete('/candidates/:id', authenticateToken, async (req, res) => {
  try {
    const candidateId = parseInt(req.params.id);

    await prisma.candidate.delete({
      where: {
        id: candidateId
      }
    });

    return res.json({ message: 'Candidate deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting candidate:', error);
    return res.status(500).json({ error: error.message || 'Failed to delete candidate' });
  }
});

export default router;
