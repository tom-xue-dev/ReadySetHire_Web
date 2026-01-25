import { Router, Request, Response } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { ollamaService } from '../services/ollama';

const router = Router();

interface AnalyzeResumeRequest {
  jdText: string;
  resumeText: string;
  settings?: {
    level?: string;
    mustHaveWeight?: number;
    language?: string;
    anonymize?: boolean;
  };
}

interface AnalysisResult {
  score: number;
  conclusion: 'STRONG_HIRE' | 'HIRE' | 'LEAN_HIRE' | 'LEAN_NO' | 'NO';
  topStrengths: Array<{ point: string; evidence: string }>;
  topGaps: Array<{ gap: string; severity: 'high' | 'medium' | 'low' }>;
  risks: string[];
  hardRequirements: Array<{ requirement: string; status: 'pass' | 'warning' | 'fail'; evidence: string }>;
  skillsMatrix: Array<{ skill: string; candidateEvidence: string; match: number }>;
  interviewQuestions: Array<{ question: string; purpose: string; goodAnswer: string }>;
}

/**
 * POST /api/resume-rating/analyze
 * Analyze JD and resume match using LLM
 */
router.post(
  '/resume-rating/analyze',
  authenticateToken,
  requireRole(['ADMIN', 'EMPLOYEE']),
  async (req: Request, res: Response) => {
    try {
      const { jdText, resumeText, settings } = req.body as AnalyzeResumeRequest;

      if (!jdText || !resumeText) {
        return res.status(400).json({
          error: 'Missing required fields: jdText and resumeText are required',
        });
      }

      console.log('🔍 Analyzing resume against JD...');
      console.log('JD length:', jdText.length);
      console.log('Resume length:', resumeText.length);
      console.log('Settings:', settings);

      // 使用 Ollama 服务进行真实分析
      const result = await ollamaService.analyzeResumeMatch(jdText, resumeText, settings);

      console.log('✅ Analysis completed with score:', result.score);
      
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('❌ Resume analysis failed:', error);
      return res.status(500).json({
        error: 'Resume analysis failed',
        message: error.message,
      });
    }
  }
);

export default router;
