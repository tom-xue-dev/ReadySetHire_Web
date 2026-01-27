"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const ollama_1 = require("../services/ollama");
const router = (0, express_1.Router)();
/**
 * POST /api/resume-rating/analyze
 * Analyze JD and resume match using LLM
 */
router.post('/resume-rating/analyze', auth_1.authenticateToken, (0, auth_1.requireRole)(['ADMIN', 'EMPLOYEE']), async (req, res) => {
    try {
        const { jdText, resumeText, settings } = req.body;
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
        const result = await ollama_1.ollamaService.analyzeResumeMatch(jdText, resumeText, settings);
        console.log('✅ Analysis completed with score:', result.score);
        return res.status(200).json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        console.error('❌ Resume analysis failed:', error);
        return res.status(500).json({
            error: 'Resume analysis failed',
            message: error.message,
        });
    }
});
exports.default = router;
//# sourceMappingURL=resumeRating.routes.js.map