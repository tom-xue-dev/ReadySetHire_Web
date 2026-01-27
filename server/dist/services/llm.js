"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.llmService = exports.LLMService = void 0;
const openai_1 = require("openai");
class LLMService {
    openai;
    constructor() {
        this.openai = new openai_1.OpenAI({
            apiKey: process.env.OPENAI_API_KEY || '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',
        });
    }
    /**
     * Generate interview questions based on job description
     * @param jobDescription - The job description text
     * @param jobTitle - The job title
     * @param count - Number of questions to generate (default: 5)
     * @returns Promise<GeneratedQuestion[]>
     */
    async generateQuestions(jobDescription, jobTitle, count = 5) {
        try {
            console.log(`🤖 Generating ${count} questions for position: ${jobTitle}`);
            const prompt = this.createPrompt(jobDescription, jobTitle, count);
            const completion = await this.openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: "You are an expert technical recruiter and interviewer. Generate high-quality interview questions based on job descriptions."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 2000,
            });
            const response = completion.choices[0]?.message?.content;
            if (!response) {
                throw new Error('No response from OpenAI');
            }
            console.log('🤖 LLM Response:', response);
            // Parse the JSON response
            const questions = this.parseQuestionsResponse(response);
            console.log(`✅ Generated ${questions.length} questions successfully`);
            return questions;
        }
        catch (error) {
            console.error('❌ Failed to generate questions:', error);
            throw new Error(`Question generation failed: ${error.message}`);
        }
    }
    /**
     * Create a detailed prompt for question generation
     */
    createPrompt(jobDescription, jobTitle, count) {
        return `
Based on the following job posting, generate ${count} diverse and relevant interview questions.

**Job Title:** ${jobTitle}

**Job Description:**
${jobDescription}

**Requirements:**
1. Generate exactly ${count} questions
2. Mix of difficulties: EASY (basic concepts), INTERMEDIATE (practical application), ADVANCED (complex scenarios)
3. Include different types: technical skills, problem-solving, behavioral, and role-specific questions
4. Questions should be specific to the role and industry
5. Each question should be clear, concise, and actionable

**Response Format (JSON only):**
\`\`\`json
[
  {
    "question": "Explain the difference between REST and GraphQL APIs and when you would use each.",
    "difficulty": "INTERMEDIATE",
    "type": "technical"
  },
  {
    "question": "Describe a time when you had to debug a complex production issue. What was your approach?",
    "difficulty": "ADVANCED", 
    "type": "behavioral"
  }
]
\`\`\`

Generate ${count} questions now:
`;
    }
    /**
     * Parse the LLM response and extract questions
     */
    parseQuestionsResponse(response) {
        try {
            // Extract JSON from response (handle markdown code blocks)
            const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            const jsonString = jsonMatch ? jsonMatch[1] : response;
            const parsed = JSON.parse(jsonString.trim());
            if (!Array.isArray(parsed)) {
                throw new Error('Response is not an array');
            }
            return parsed.map((item, index) => {
                if (!item.question || !item.difficulty) {
                    throw new Error(`Invalid question format at index ${index}`);
                }
                return {
                    question: String(item.question).trim(),
                    difficulty: this.normalizeDifficulty(item.difficulty),
                    type: item.type || 'general'
                };
            });
        }
        catch (error) {
            console.error('❌ Failed to parse LLM response:', error);
            console.error('Raw response:', response);
            // Fallback: try to extract questions manually
            return this.extractQuestionsManually(response);
        }
    }
    /**
     * Normalize difficulty to match our enum
     */
    normalizeDifficulty(difficulty) {
        const normalized = difficulty.toUpperCase();
        if (['EASY', 'INTERMEDIATE', 'ADVANCED'].includes(normalized)) {
            return normalized;
        }
        // Default mapping
        if (normalized.includes('BASIC') || normalized.includes('BEGINNER'))
            return 'EASY';
        if (normalized.includes('HARD') || normalized.includes('EXPERT'))
            return 'ADVANCED';
        return 'INTERMEDIATE'; // Default
    }
    /**
     * Manual extraction as fallback
     */
    extractQuestionsManually(response) {
        console.log('🔧 Attempting manual question extraction...');
        // Simple fallback questions based on common patterns
        const fallbackQuestions = [
            {
                question: "Tell me about your experience with the technologies mentioned in this role.",
                difficulty: "EASY",
                type: "general"
            },
            {
                question: "How would you approach solving a complex technical problem in this position?",
                difficulty: "INTERMEDIATE",
                type: "technical"
            },
            {
                question: "Describe a challenging project you've worked on and how you overcame obstacles.",
                difficulty: "ADVANCED",
                type: "behavioral"
            }
        ];
        console.log('⚠️ Using fallback questions due to parsing error');
        return fallbackQuestions;
    }
}
exports.LLMService = LLMService;
exports.llmService = new LLMService();
//# sourceMappingURL=llm.js.map