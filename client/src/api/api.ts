// Import configuration from centralized config file
import { apiConfig } from '../config/apiConfig';

const API_BASE_URL = apiConfig.baseUrl;

const API_LOG_ENABLED = apiConfig.apiLogs;

function generateRequestId(): string {
  const rand: string = Math.random().toString(36).slice(2, 8);
  return `${Date.now().toString(36)}-${rand}`;
}

function maskHeaders(headers: Record<string, string> | null | undefined): Record<string, string> {
  const masked: Record<string, string> = { ...(headers || {}) };
  if (masked.Authorization) {
    const token: string = String(masked.Authorization);
    masked.Authorization = token.length > 16 ? `${token.slice(0, 12)}...` : '***';
  }
  return masked;
}

function preview(value: unknown, max: number = 200): string {
  try {
    const text: string = typeof value === 'string' ? value : JSON.stringify(value);
    return text.length > max ? `${text.slice(0, max)}…` : text;
  } catch (_e) {
    return '[unserializable]';
  }
}

function nowMs(): number {
  try {
    return typeof performance !== 'undefined' ? performance.now() : Date.now();
  } catch (_e) {
    return Date.now();
  }
}

/**
 * Get the current JWT token from localStorage
 */
function getAuthToken(): string {
  return localStorage.getItem('token') || '';
}

/**
 * Helper function to handle API requests with timeout and error handling.
 * It sets the Authorization token and optionally includes the request body.
 *
 * @param {string} endpoint - The API endpoint to call.
 * @param {string} [method='GET'] - The HTTP method to use (GET, POST, PATCH).
 * @param {object} [body=null] - The request body to send, typically for POST or PATCH.
 * @param {number} [timeout=10000] - Request timeout in milliseconds (default: 10000ms).
 * @returns {Promise<object>} - The JSON response from the API.
 * @throws Will throw an error if the HTTP response is not OK or request times out.
 */
export async function apiRequest(endpoint: string, method: string = 'GET', body: Record<string, unknown> | null = null, timeout: number = 10000): Promise<Record<string, unknown> | null> {
    // Create AbortController for request timeout
    const controller: AbortController = new AbortController();
    const timeoutId: ReturnType<typeof setTimeout> = setTimeout(() => controller.abort(), timeout);
    const requestId: string = generateRequestId();
    const start: number = nowMs();

    const token = getAuthToken();
    
    // Debug: Log token status
    if (!token) {
        console.warn('⚠️ No token found in localStorage for request:', endpoint);
        console.warn('⚠️ localStorage.getItem("token"):', localStorage.getItem('token'));
    } else {
        console.log('🔑 Token found, length:', token.length);
    }
    
    const headers: Record<string, string> = {
        'Content-Type': 'application/json', // Indicate that we are sending JSON data
    };
    
    // Only add Authorization header if token exists
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    } else {
        console.error('❌ Cannot add Authorization header - token is empty');
    }

    // If the method is POST or PATCH, we want the response to include the full representation
    if (method === 'POST' || method === 'PATCH') {
        headers['Prefer'] = 'return=representation';
    }

    const options: RequestInit = {
        method, // Set the HTTP method (GET, POST, PATCH)
        headers,
        signal: controller.signal, // Add signal for timeout control
    };

    // If a body is provided, add it to the request
    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        if (API_LOG_ENABLED) {
            console.groupCollapsed(`🛰️ API ${method} ${endpoint} [${requestId}]`);
            console.log('URL:', `${API_BASE_URL}${endpoint}`);
            console.log('Headers:', maskHeaders(headers));
            console.log('Authorization header present:', !!headers['Authorization']);
            console.log('Options:', { ...options, headers: maskHeaders(headers) });
            if (body) console.log('Body:', preview(body));
            console.groupEnd();
        }

        // Make the API request and check if the response is OK
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        clearTimeout(timeoutId); // Clear timeout if request completes

        if (response.status === 204) {
            if (API_LOG_ENABLED) {
                const duration: number = Math.round(nowMs() - start);
                console.log(`✅ API ${method} ${endpoint} [${requestId}] → 204 No Content (${duration}ms)`);
            }
            return null;
        }
        if (!response.ok) {
            const errorText: string = await response.text().catch(() => 'Unknown error');
            const duration: number = Math.round(nowMs() - start);
            
            // Handle 401 Unauthorized - token is invalid or expired
            if (response.status === 401) {
                console.warn('🔐 Authentication failed - token may be invalid or expired');
                
                // Clear invalid token from localStorage
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                
                // Dispatch a custom event to notify components about authentication failure
                window.dispatchEvent(new CustomEvent('auth-failed', {
                    detail: { 
                        reason: 'Invalid or expired token',
                        endpoint: endpoint,
                        method: method
                    }
                }));
                
                // Redirect to login page if not already there
                if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
                    console.log('🔄 Redirecting to login page due to authentication failure');
                    window.location.href = '/login';
                }
            }
            
            const err: Error = new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            if (API_LOG_ENABLED) {
                console.error(`❌ API ${method} ${endpoint} [${requestId}] failed (${duration}ms)`, { status: response.status, error: preview(errorText) });
            }
            throw err;
        }

        // Parse JSON once so we can log a preview
        const json: Record<string, unknown> = await response.json() as Record<string, unknown>;
        if (API_LOG_ENABLED) {
            const duration: number = Math.round(nowMs() - start);
            const contentLength: string | null = response.headers.get('content-length');
            console.log(`✅ API ${method} ${endpoint} [${requestId}] → ${response.status} (${duration}ms)`, {
                size: contentLength ? `${contentLength} bytes` : 'unknown',
                preview: preview(json, 300)
            });
        }
        return json;
    } catch (error: unknown) {
        clearTimeout(timeoutId); // Clear timeout on error
        
        if (error instanceof Error && error.name === 'AbortError') {
            const duration: number = Math.round(nowMs() - start);
            const err: Error = new Error(`Request timeout after ${timeout}ms`);
            if (API_LOG_ENABLED) {
                console.error(`⏱️  API ${method} ${endpoint} [${requestId}] timed out (${duration}ms)`);
            }
            throw err;
        }
        if (API_LOG_ENABLED) {
            const duration: number = Math.round(nowMs() - start);
            console.error(`❌ API ${method} ${endpoint} [${requestId}] exception (${duration}ms)`, error);
        }
        throw error; // Re-throw other errors
    }
}


// Applicants APIs - Updated for new API format
export async function getAllApplicants(): Promise<unknown[]> {
    const response = await apiRequest(`/applicants`);
    if (response && typeof response === 'object' && 'data' in response && Array.isArray(response.data)) {
        return response.data;
    }
    if (Array.isArray(response)) {
        return response;
    }
    return [];
}

export async function getApplicantsByInterview(interviewId: string | number): Promise<unknown[]> {
    const response = await apiRequest(`/interviews/${interviewId}/applicants`);
    if (response && typeof response === 'object' && 'data' in response && Array.isArray(response.data)) {
        return response.data;
    }
    if (Array.isArray(response)) {
        return response;
    }
    return [];
}

export async function createApplicant(applicant: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    return apiRequest(`/applicants`, 'POST', applicant);
}

export async function updateApplicant(id: string | number, data: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    return apiRequest(`/applicants/${id}`, 'PATCH', data);
}

export async function deleteApplicant(id: string | number): Promise<Record<string, unknown> | null> {
    return apiRequest(`/applicants/${id}`, 'DELETE');
}

export async function bindApplicantToInterview(applicantId: string | number, interviewId: string | number, status: string = 'NOT_STARTED'): Promise<Record<string, unknown> | null> {
    // Preferred RESTful: POST /interviews/:interviewId/applicants
    return apiRequest(`/interviews/${interviewId}/applicants`, 'POST', { applicant_id: applicantId, status });
}

export async function unbindApplicantFromInterview(applicantId: string | number, interviewId: string | number): Promise<Record<string, unknown> | null> {
    return apiRequest(`/interviews/${interviewId}/applicants/${applicantId}`, 'DELETE');
}

export async function updateApplicantInterviewStatus(applicantId: string | number, interviewId: string | number, status: string = 'COMPLETED'): Promise<Record<string, unknown> | null> {
    return apiRequest(`/interviews/${interviewId}/applicants/${applicantId}`, 'PATCH', { status });
}

// Applicant Answer APIs - Updated for new API format
export async function getAnswersByApplicant(applicantId: string | number): Promise<unknown[]> {
    const response = await apiRequest(`/applicant_answers/applicant/${applicantId}`);
    // New API returns {data: [], pagination: {}} format
    return (response as { data?: unknown[] })?.data || [];
}

export async function getAnswersByInterviewAndApplicant(interviewId: string | number, applicantId: string | number): Promise<unknown[]> {
    const response = await apiRequest(`/applicant_answers/interview/${interviewId}/applicant/${applicantId}`);
    return (response as { data?: unknown[] })?.data || [];
}

export async function createApplicantAnswer(answer: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    return apiRequest(`/applicant_answers`, 'POST', answer);
}

export async function updateApplicantAnswer(id: string | number, data: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    return apiRequest(`/applicant_answers/${id}`, 'PATCH', data);
}

// Health check endpoint for connection testing
export async function healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
        // Create a controller for timeout
        const controller: AbortController = new AbortController();
        const timeoutId: ReturnType<typeof setTimeout> = setTimeout(() => controller.abort(), 8000); // 8 second timeout
        const requestId: string = generateRequestId();
        const start: number = nowMs();
        
        // Try a simple endpoint that should always be available
        const response: Response = await fetch(`${API_BASE_URL}/health`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
            if (API_LOG_ENABLED) {
                const duration: number = Math.round(nowMs() - start);
                console.log(`✅ API GET /health [${requestId}] → ${response.status} (${duration}ms)`);
            }
            return { status: 'healthy', timestamp: new Date().toISOString() };
        } else {
            const duration: number = Math.round(nowMs() - start);
            const err: Error = new Error(`Server responded with status: ${response.status}`);
            if (API_LOG_ENABLED) {
                console.error(`❌ API GET /health [${requestId}] failed (${duration}ms)`, { status: response.status });
            }
            throw err;
        }
    } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') {
            if (API_LOG_ENABLED) console.error('⏱️  API GET /health timed out');
            throw new Error('Connection timeout - server is not responding');
        }
        if (API_LOG_ENABLED) console.error('❌ API GET /health exception', error);
        const errorMessage: string = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Connection failed: ${errorMessage}`);
    }
}

// Billing APIs
export async function createCheckoutSession(): Promise<Record<string, unknown> | null> {
    return apiRequest(`/billing/create-checkout-session`, 'POST', {});
}

// Demo subscription API - activates subscription without payment
export interface DemoSubscribeResponse {
    success: boolean;
    message: string;
    subscription: {
        plan: string;
        status: string;
        startedAt: string;
        expiresAt: string;
    };
}

export async function demoSubscribe(planId: string): Promise<DemoSubscribeResponse | null> {
    return apiRequest(`/billing/demo-subscribe`, 'POST', { planId }) as Promise<DemoSubscribeResponse | null>;
}

// Get current subscription status
export interface SubscriptionStatus {
    plan: string | null;
    status: string | null;
    startedAt: string | null;
    expiresAt: string | null;
}

export async function getSubscriptionStatus(): Promise<SubscriptionStatus | null> {
    return apiRequest(`/billing/subscription-status`, 'GET') as Promise<SubscriptionStatus | null>;
}

// Saved Jobs APIs
export async function getSavedJobs(employeeId: number): Promise<unknown[]> {
    const response = await apiRequest(`/employees/${employeeId}/saved-jobs`);
    return (response as { data?: unknown[] })?.data || [];
}

export async function saveJob(employeeId: number, jobId: number): Promise<Record<string, unknown> | null> {
    return apiRequest(`/employees/${employeeId}/saved-jobs/${jobId}`, 'PUT', {});
}

export async function unsaveJob(employeeId: number, jobId: number): Promise<Record<string, unknown> | null> {
    return apiRequest(`/employees/${employeeId}/saved-jobs/${jobId}`, 'DELETE');
}

// Resume Rating APIs
export interface AnalyzeResumeRequest {
    jdText: string;
    resumeText: string;
    settings?: {
        level?: string;
        mustHaveWeight?: number;
        language?: string;
        anonymize?: boolean;
    };
}

export interface AnalysisResult {
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
 * Analyze JD and resume match using AI
 * @param {AnalyzeResumeRequest} request - The analysis request containing JD and resume text
 * @returns {Promise<AnalysisResult>} - The analysis result
 */
export async function analyzeResume(request: AnalyzeResumeRequest): Promise<AnalysisResult> {
    // 使用更长的超时时间（2分钟），因为 LLM 推理需要时间
    const response = await apiRequest('/resume-rating/analyze', 'POST', request as unknown as Record<string, unknown>, 120000);
    if (response && typeof response === 'object' && 'data' in response) {
        return response.data as AnalysisResult;
    }
    throw new Error('Invalid response format from resume analysis API');
}





