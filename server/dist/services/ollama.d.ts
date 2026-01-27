export interface ResumeAnalysisResult {
    score: number;
    conclusion: 'STRONG_HIRE' | 'HIRE' | 'LEAN_HIRE' | 'LEAN_NO' | 'NO';
    topStrengths: Array<{
        point: string;
        evidence: string;
    }>;
    topGaps: Array<{
        gap: string;
        severity: 'high' | 'medium' | 'low';
    }>;
    risks: string[];
    hardRequirements: Array<{
        requirement: string;
        status: 'pass' | 'warning' | 'fail';
        evidence: string;
    }>;
    skillsMatrix: Array<{
        skill: string;
        candidateEvidence: string;
        match: number;
    }>;
    interviewQuestions: Array<{
        question: string;
        purpose: string;
        goodAnswer: string;
    }>;
}
export declare class OllamaService {
    private client;
    private model;
    constructor();
    analyzeResumeMatch(jdText: string, resumeText: string, settings?: {
        level?: string;
        mustHaveWeight?: number;
        language?: string;
        anonymize?: boolean;
    }): Promise<ResumeAnalysisResult>;
    /**
     * 创建分析提示词
     */
    private createAnalysisPrompt;
    /**
     * 解析 LLM 返回的分析结果
     */
    private parseAnalysisResponse;
    /**
     * 规范化结论
     */
    private normalizeConclusion;
    /**
     * 降级结果（当解析失败时使用）
     */
    private getFallbackResult;
}
export declare const ollamaService: OllamaService;
//# sourceMappingURL=ollama.d.ts.map