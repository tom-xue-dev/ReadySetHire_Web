import { apiRequest } from './api';
import type { Interview } from '@/types';
/**
 * Function to insert a new project into the database.
 *
 * @param {object} project - The project data to insert.
 * @returns {Promise<object>} - The created project object returned by the API.
 */
export async function createInterview(interview: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    return apiRequest('/interviews', 'POST', interview);
}

/**
 * Function to list all interviews associated with the current user.
 *
 * @returns {Promise<Array>} - An array of interview objects.
 */
export async function getInterviews(): Promise<Interview[]> {
    const response = await apiRequest('/interviews');
    const data = (response as { data?: unknown[] })?.data || [];
    return data as Interview[];
}

/**
 * Function to get a single project by its ID.
 * The url is slightly different from usual RESTFul ...
 * See the operators section https://docs.postgrest.org/en/v12/references/api/tables_views.html
 * @param {string} id - The ID of the project to retrieve.
 * @returns {Promise<object>} - The project object matching the ID.
 */
export async function getInterview(id: string | number): Promise<Record<string, unknown> | null> {
    return apiRequest(`/interviews/${id}`);
}

// Update interview by id (PostgREST style)
export async function updateInterview(id: string | number, data: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    return apiRequest(`/interviews/${id}`, 'PATCH', data);
}

// Delete interview by id
export async function deleteInterview(id: string | number): Promise<Record<string, unknown> | null> {
    return apiRequest(`/interviews/${id}`, 'DELETE');
}
