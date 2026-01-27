export interface GeneratedQuestion {
    question: string;
    difficulty: 'EASY' | 'INTERMEDIATE' | 'ADVANCED';
    type: 'technical' | 'behavioral' | 'general';
}
export declare class LLMService {
    private openai;
    constructor();
    /**
     * Generate interview questions based on job description
     * @param jobDescription - The job description text
     * @param jobTitle - The job title
     * @param count - Number of questions to generate (default: 5)
     * @returns Promise<GeneratedQuestion[]>
     */
    generateQuestions(jobDescription: string, jobTitle: string, count?: number): Promise<GeneratedQuestion[]>;
    /**
     * Create a detailed prompt for question generation
     */
    private createPrompt;
    /**
     * Parse the LLM response and extract questions
     */
    private parseQuestionsResponse;
    /**
     * Normalize difficulty to match our enum
     */
    private normalizeDifficulty;
    /**
     * Manual extraction as fallback
     */
    private extractQuestionsManually;
}
export declare const llmService: LLMService;
//# sourceMappingURL=llm.d.ts.map