import { apiRequest } from './api';
/**
 * Function to get a single job by its ID.
 * PostgREST style query format to match interview API.
 * @param {string} id - The ID of the job to retrieve.
 * @returns {Promise<object>} - The job object matching the ID.
 */
export async function getJob(id: string | number): Promise<Record<string, unknown> | null> {
    return apiRequest(`/jobs/${id}`);
}

/**
 * Function to list all jobs.
 *
 * @returns {Promise<Array>} - An array of job objects.
 */
export async function getJobs(): Promise<unknown[]> {
    const response = await apiRequest('/jobs');
    return (response as { data?: unknown[] })?.data || [];
}



/**
 * Function to create a new job.
 * PostgREST style to match interview API.
 * @param {object} jobData - The job data to create.
 * @returns {Promise<object>} - The created job object.
 */
export async function createJob(jobData: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    return apiRequest('/jobs', 'POST', jobData);
}

/**
 * Function to update a job.
 * PostgREST style query format to match interview API.
 * @param {string} id - The ID of the job to update.
 * @param {object} jobData - The job data to update.
 * @returns {Promise<object>} - The updated job object.
 */
export async function updateJob(id: string | number, jobData: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    return apiRequest(`/jobs/${id}`, 'PATCH', jobData);
}

// Publish job by id
export async function publishJob(id: string | number): Promise<Record<string, unknown> | null> {
    return apiRequest(`/jobs/${id}/publish`, 'PATCH', {});
}

/**
 * Function to delete a job.
 * PostgREST style query format to match interview API.
 * @param {string} id - The ID of the job to delete.
 * @returns {Promise<void>} - No return value.
 */
export async function deleteJob(id: string | number): Promise<Record<string, unknown> | null> {
    return apiRequest(`/jobs/${id}`, 'DELETE');
}
