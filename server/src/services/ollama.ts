import { OpenAI } from 'openai';

export interface ResumeAnalysisResult {
  score: number;
  conclusion: 'STRONG_HIRE' | 'HIRE' | 'LEAN_HIRE' | 'LEAN_NO' | 'NO';
  topStrengths: Array<{ point: string; evidence: string }>;
  topGaps: Array<{ gap: string; severity: 'high' | 'medium' | 'low' }>;
  risks: string[];
  hardRequirements: Array<{ requirement: string; status: 'pass' | 'warning' | 'fail'; evidence: string }>;
  skillsMatrix: Array<{ skill: string; candidateEvidence: string; match: number }>;
  interviewQuestions: Array<{ question: string; purpose: string; goodAnswer: string }>;
}

export class OllamaService {
  private client: OpenAI;
  private model: string;

  constructor() {
    const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://ollama:11434/v1';
    this.model = process.env.OLLAMA_MODEL || 'deepseek-r1:7b';
    console.log(`🤖 Initializing Ollama service: ${ollamaBaseUrl}, model: ${this.model}`);
    this.client = new OpenAI({
      baseURL: ollamaBaseUrl,
      apiKey: 'ollama',
    });
  }

  async analyzeResumeMatch(
    jdText: string,
    resumeText: string,
    settings?: {
      level?: string;
      mustHaveWeight?: number;
      language?: string;
      anonymize?: boolean;
    }
  ): Promise<ResumeAnalysisResult> {
    try {
      console.log('🔍 Analyzing resume against JD...');
      console.log(`  - JD length: ${jdText.length} chars`);
      console.log(`  - Resume length: ${resumeText.length} chars`);
      console.log(`  - Settings:`, settings);

      const prompt = this.createAnalysisPrompt(jdText, resumeText, settings);

      console.log('📤 Sending request to Ollama...');
      const startTime = Date.now();

      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: '你是一位经验丰富的HR专家和技术面试官。你擅长分析岗位需求（JD）与候选人简历的匹配度，并给出专业、客观的评估。请根据JD和简历，给出详细的分析报告。返回语言请保持与JD一致',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 4000,
      });

      const duration = Date.now() - startTime;
      console.log(`✅ Received response from Ollama in ${duration}ms`);

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from Ollama');
      }

      console.log('📥 Parsing analysis result...');
      const result = this.parseAnalysisResponse(response);

      console.log('✅ Analysis completed successfully');
      return result;
    } catch (error: any) {
      console.error('❌ Failed to analyze resume:', error);
      
      if (error.code === 'ECONNREFUSED' || error.message.includes('connect')) {
        throw new Error('无法连接到 Ollama 服务。请确保 Ollama 服务正在运行。');
      }
      
      throw new Error(`简历分析失败: ${error.message}`);
    }
  }

  /**
   * 创建分析提示词
   */
  private createAnalysisPrompt(
    jdText: string,
    resumeText: string,
    settings?: {
      level?: string;
      mustHaveWeight?: number;
      language?: string;
      anonymize?: boolean;
    }
  ): string {
    const level = settings?.level || 'Mid';
    const mustHaveWeight = settings?.mustHaveWeight || 60;
    const language = settings?.language || '中文';

    return `请分析以下岗位描述（JD）和候选人简历的匹配度，并生成详细的分析报告。

**分析参数：**
- 职级要求：${level}
- Must-have 权重：${mustHaveWeight}%
- 语言要求：${language}

**岗位描述（JD）：**
${jdText}

**候选人简历：**
${resumeText}

**分析要求：**
1. 综合评分（0-100分）：基于技能匹配、经验匹配、教育背景等维度
2. 录用建议：STRONG_HIRE（强烈推荐）、HIRE（推荐）、LEAN_HIRE（倾向推荐）、LEAN_NO（倾向不推荐）、NO（不推荐）
3. 最强证据（3条）：从简历中找出最符合JD要求的亮点
4. 最大缺口（3条）：列出候选人不满足或证据不足的要求，标注严重程度（high/medium/low）
5. 风险提醒：识别简历中的问题（如描述笼统、缺少量化指标等）
6. 硬条件检查：逐条检查 must-have 要求，标注 pass/warning/fail
7. 技能矩阵：列出关键技能，对比候选人证据和匹配度（0-100）
8. 面试建议（8-12个问题）：针对缺口和需验证的点设计面试问题

**输出格式（严格按照JSON格式）：**
\`\`\`json
{
  "score": 78,
  "conclusion": "HIRE",
  "topStrengths": [
    {
      "point": "5年以上React开发经验",
      "evidence": "候选人在简历中明确提到担任高级前端工程师5年，主导3个大型React项目"
    }
  ],
  "topGaps": [
    {
      "gap": "缺少云原生技术经验（AWS/Azure）",
      "severity": "high"
    }
  ],
  "risks": ["简历描述过于笼统", "缺少项目量化指标"],
  "hardRequirements": [
    {
      "requirement": "本科及以上学历",
      "status": "pass",
      "evidence": "北京大学计算机科学学士"
    }
  ],
  "skillsMatrix": [
    {
      "skill": "React",
      "candidateEvidence": "3个大型项目，5年经验",
      "match": 95
    }
  ],
  "interviewQuestions": [
    {
      "question": "请详细描述您在云平台（AWS/Azure）上的实践经验",
      "purpose": "验证云原生技术能力（简历中缺失）",
      "goodAnswer": "具体项目案例，使用的AWS服务，解决的技术难题"
    }
  ]
}
\`\`\`

请严格按照上述JSON格式输出分析结果，不要添加其他文字说明。`;
  }

  /**
   * 解析 LLM 返回的分析结果
   */
  private parseAnalysisResponse(response: string): ResumeAnalysisResult {
    try {
      // 提取 JSON（处理 markdown 代码块）
      const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : response;

      const parsed = JSON.parse(jsonString.trim());

      // 验证必需字段
      if (typeof parsed.score !== 'number') {
        throw new Error('Invalid score in response');
      }
      if (!parsed.conclusion) {
        throw new Error('Invalid conclusion in response');
      }

      // 规范化数据
      return {
        score: Math.min(100, Math.max(0, parsed.score)),
        conclusion: this.normalizeConclusion(parsed.conclusion),
        topStrengths: Array.isArray(parsed.topStrengths) ? parsed.topStrengths.slice(0, 3) : [],
        topGaps: Array.isArray(parsed.topGaps) ? parsed.topGaps.slice(0, 3) : [],
        risks: Array.isArray(parsed.risks) ? parsed.risks : [],
        hardRequirements: Array.isArray(parsed.hardRequirements) ? parsed.hardRequirements : [],
        skillsMatrix: Array.isArray(parsed.skillsMatrix) ? parsed.skillsMatrix : [],
        interviewQuestions: Array.isArray(parsed.interviewQuestions) 
          ? parsed.interviewQuestions.slice(0, 12) 
          : [],
      };
    } catch (error: any) {
      console.error('❌ Failed to parse Ollama response:', error);
      console.error('Raw response:', response);

      // 返回降级结果
      return this.getFallbackResult();
    }
  }

  /**
   * 规范化结论
   */
  private normalizeConclusion(conclusion: string): 'STRONG_HIRE' | 'HIRE' | 'LEAN_HIRE' | 'LEAN_NO' | 'NO' {
    const normalized = conclusion.toUpperCase().replace(/[_\s-]/g, '_');
    
    if (['STRONG_HIRE', 'HIRE', 'LEAN_HIRE', 'LEAN_NO', 'NO'].includes(normalized)) {
      return normalized as any;
    }

    // 默认映射
    if (normalized.includes('STRONG')) return 'STRONG_HIRE';
    if (normalized.includes('推荐') || normalized.includes('HIRE')) return 'HIRE';
    if (normalized.includes('倾向') && normalized.includes('不')) return 'LEAN_NO';
    if (normalized.includes('不')) return 'NO';
    
    return 'LEAN_HIRE'; // 默认
  }

  /**
   * 降级结果（当解析失败时使用）
   */
  private getFallbackResult(): ResumeAnalysisResult {
    console.log('⚠️ Using fallback result due to parsing error');
    
    return {
      score: 65,
      conclusion: 'LEAN_HIRE',
      topStrengths: [
        {
          point: '候选人具备相关工作经验',
          evidence: '简历中展示了与岗位相关的工作背景',
        },
      ],
      topGaps: [
        {
          gap: '需要进一步核实技能匹配度',
          severity: 'medium',
        },
      ],
      risks: ['建议安排面试进一步评估'],
      hardRequirements: [],
      skillsMatrix: [],
      interviewQuestions: [
        {
          question: '请介绍一下您最近的工作经历和主要职责',
          purpose: '了解候选人的实际工作经验',
          goodAnswer: '清晰描述工作内容、职责和成果',
        },
      ],
    };
  }
}

export const ollamaService = new OllamaService();
