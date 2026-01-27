export interface User {
    id?: number;
    username: string;
    email: string;
    password_hash: string;
    first_name?: string;
    last_name?: string;
    role: 'admin' | 'recruiter' | 'employee';
    created_at?: Date;
    updated_at?: Date;
}
export interface Job {
    id?: number;
    title: string;
    description: string;
    requirements?: string;
    location?: string;
    salary_range?: string;
    status: 'draft' | 'published' | 'closed';
    user_id: number;
    published_at?: Date;
    created_at?: Date;
    updated_at?: Date;
}
export interface Interview {
    id?: number;
    title: string;
    job_role: string;
    description?: string;
    status: 'draft' | 'published' | 'archived';
    user_id: number;
    job_id?: number;
    created_at?: Date;
    updated_at?: Date;
}
export interface Question {
    id?: number;
    interview_id: number;
    question: string;
    difficulty: 'easy' | 'intermediate' | 'advanced';
    user_id: number;
    created_at?: Date;
    updated_at?: Date;
}
export interface Applicant {
    id?: number;
    interview_id: number;
    title: string;
    firstname: string;
    surname: string;
    phone_number?: string;
    email_address: string;
    interview_status: 'not_started' | 'completed';
    user_id: number;
    created_at?: Date;
    updated_at?: Date;
}
export interface ApplicantAnswer {
    id?: number;
    interview_id: number;
    question_id: number;
    applicant_id: number;
    answer?: string;
    user_id: number;
    created_at?: Date;
    updated_at?: Date;
}
//# sourceMappingURL=index.d.ts.map