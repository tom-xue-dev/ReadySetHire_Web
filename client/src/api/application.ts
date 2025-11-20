import { apiRequest } from './api';
import { apiConfig } from '@/config/apiConfig';

export async function downloadResume(resumeId: string | number): Promise<{ filename: string }> {
    const API_BASE_URL:string = apiConfig.baseUrl;
    const token: string = localStorage.getItem('token') || '';
    const res: Response = await fetch(`${API_BASE_URL}/resumes/${resumeId}/download`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    if (!res.ok) {
        const text: string = await res.text().catch(() => '');
        throw new Error(`Failed to download resume (${res.status}): ${text}`);
    }
    const blob: Blob = await res.blob();
    const cd: string = res.headers.get('content-disposition') || '';
    const match: RegExpMatchArray | null = cd.match(/filename="?([^";]+)"?/i);
    const filename: string = match ? match[1] : `resume-${resumeId}`;
    const url: string = URL.createObjectURL(blob);
    const a: HTMLAnchorElement = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return { filename };
}


// Applications APIs
export async function getAllApplications(params: { page?: number | string; status?: string; jobId?: string | number } = {}): Promise<Record<string, unknown> | null> {
    const qs: URLSearchParams = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    // if (params.limit) qs.set('limit', String(params.limit));
    if (params.status) qs.set('status', String(params.status));
    if (params.jobId) qs.set('jobId', String(params.jobId));
    const suffix: string = qs.toString() ? `?${qs.toString()}` : '';
    return apiRequest(`/applications${suffix}`);
}

export async function getApplicationById(id: string | number): Promise<Record<string, unknown> | null> {
    return apiRequest(`/applications/${id}`);
}

export async function updateApplicationStatus(id: string | number, status: string, notes: string = ''): Promise<Record<string, unknown> | null> {
    return apiRequest(`/applications/${id}/status`, 'PATCH', { status, notes });
}