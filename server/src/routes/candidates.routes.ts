import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { ollamaService } from '../services/ollama';

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
        },
        applications: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            job: {
              select: {
                id: true,
                title: true,
                status: true,
                location: true,
                description: true,
                requirements: true,
              }
            },
            resume: {
              select: {
                id: true,
                originalName: true,
                fileName: true,
                extractedText: true,
              }
            }
          }
        },
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

// 对单个 application 进行 AI 评分
router.post('/applications/:applicationId/rate', authenticateToken, async (req, res) => {
  try {
    const applicationId = parseInt(req.params.applicationId);

    // 获取 application 及关联的 job 和 resume
    const application = await prisma.jobApplication.findUnique({
      where: { id: applicationId },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            description: true,
            requirements: true,
          }
        },
        resume: {
          select: {
            id: true,
            extractedText: true,
          }
        },
        candidate: {
          select: {
            userId: true,
          }
        }
      }
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // 权限检查：只允许 candidate 的所有者（recruiter）评分
    if (application.candidate.userId !== req.user?.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // 检查是否有简历文本
    const resumeText = application.resume?.extractedText;
    if (!resumeText) {
      return res.status(400).json({ error: 'Resume text not available for analysis' });
    }

    // 构建 JD 文本
    const jdText = `${application.job.title}\n\n${application.job.description || ''}\n\n${application.job.requirements || ''}`;

    // 调用 AI 评分
    console.log(`🔍 Rating application #${applicationId}...`);
    const result = await ollamaService.analyzeResumeMatch(jdText, resumeText);

    // 保存评分结果到数据库
    const updatedApplication = await prisma.jobApplication.update({
      where: { id: applicationId },
      data: {
        score: result.score,
        feedback: JSON.stringify(result),
        scoredAt: new Date(),
      }
    });

    return res.json({
      data: {
        applicationId: updatedApplication.id,
        score: result.score,
        feedback: result,
        scoredAt: updatedApplication.scoredAt,
      }
    });
  } catch (error: any) {
    console.error('Error rating application:', error);
    return res.status(500).json({ error: error.message || 'Failed to rate application' });
  }
});

// 批量评分接口
router.post('/applications/batch-rate', authenticateToken, async (req, res) => {
  try {
    const { applicationIds } = req.body;

    if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
      return res.status(400).json({ error: 'applicationIds array is required' });
    }

    // 获取所有 applications
    const applications = await prisma.jobApplication.findMany({
      where: {
        id: { in: applicationIds },
        candidate: { userId: req.user?.id }
      },
      include: {
        job: {
          select: {
            title: true,
            description: true,
            requirements: true,
          }
        },
        resume: {
          select: {
            extractedText: true,
          }
        }
      }
    });

    // 开始评分（这里用 SSE 返回进度会更好，但为简单起见先返回最终结果）
    const results: Array<{
      applicationId: number;
      success: boolean;
      score?: number;
      error?: string;
    }> = [];

    for (const app of applications) {
      try {
        const resumeText = app.resume?.extractedText;
        if (!resumeText) {
          results.push({
            applicationId: app.id,
            success: false,
            error: 'No resume text available'
          });
          continue;
        }

        const jdText = `${app.job.title}\n\n${app.job.description || ''}\n\n${app.job.requirements || ''}`;

        console.log(`🔍 Batch rating application #${app.id}...`);
        const result = await ollamaService.analyzeResumeMatch(jdText, resumeText);

        await prisma.jobApplication.update({
          where: { id: app.id },
          data: {
            score: result.score,
            feedback: JSON.stringify(result),
            scoredAt: new Date(),
          }
        });

        results.push({
          applicationId: app.id,
          success: true,
          score: result.score
        });
      } catch (err: any) {
        console.error(`Error rating application #${app.id}:`, err);
        results.push({
          applicationId: app.id,
          success: false,
          error: err.message || 'Rating failed'
        });
      }
    }

    return res.json({ data: results });
  } catch (error: any) {
    console.error('Error batch rating applications:', error);
    return res.status(500).json({ error: error.message || 'Batch rating failed' });
  }
});

// 获取单个 application 的详细评分报告
router.get('/applications/:applicationId/feedback', authenticateToken, async (req, res) => {
  try {
    const applicationId = parseInt(req.params.applicationId);

    const application = await prisma.jobApplication.findUnique({
      where: { id: applicationId },
      select: {
        id: true,
        score: true,
        feedback: true,
        scoredAt: true,
        candidate: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    if (application.candidate.userId !== req.user?.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // 解析 feedback JSON
    let feedbackData = null;
    if (application.feedback) {
      try {
        feedbackData = JSON.parse(application.feedback);
      } catch {
        feedbackData = { raw: application.feedback };
      }
    }

    return res.json({
      data: {
        applicationId: application.id,
        candidateName: `${application.candidate.firstName || ''} ${application.candidate.lastName || ''}`.trim(),
        score: application.score,
        feedback: feedbackData,
        scoredAt: application.scoredAt,
      }
    });
  } catch (error: any) {
    console.error('Error fetching feedback:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch feedback' });
  }
});

export default router;
