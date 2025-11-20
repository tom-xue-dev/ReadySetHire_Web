import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import PageShell from '@/components/layout/PageShell';

type PublicJob = {
  id: number;
  title: string;
  description?: string;
  requirements?: string;
  location?: string;
  salary?: string;
  salaryRange?: string;
  status?: string;
  publishedAt?: string;
};

export default function PublicJobDetails() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<PublicJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const base = (import.meta as any)?.env?.VITE_API_BASE_URL || 'http://localhost:3000/api';
        const res = await fetch(`${base}/jobs/${jobId}`);
        if (!res.ok) throw new Error('Job not found');
        const data = await res.json();
        if (mounted) setJob(data);
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Failed to load job');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (jobId) load();
    return () => { mounted = false; };
  }, [jobId]);

  if (loading) {
    return (
      <PageShell>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-xl text-gray-600">Loading job…</div>
        </div>
      </PageShell>
    );
  }

  if (error || !job) {
    return (
      <PageShell>
        <div className="min-h-[60vh] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full text-center">
            <div className="text-5xl mb-4">❌</div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Unable to load job</h2>
            <p className="text-gray-600">{error || 'Unknown error'}</p>
            <button onClick={() => navigate('/')} className="mt-6 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Go Home</button>
          </div>
        </div>
      </PageShell>
    );
  }

  const salaryText = job.salaryRange || job.salary;

  return (
    <PageShell>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex flex-wrap items-start gap-4">
            <h1 className="text-4xl font-bold text-gray-900 flex-1">{job.title}</h1>
            <span className="px-3 py-1 rounded-full text-xs border self-start">{job.status || 'PUBLISHED'}</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-gray-600">
            {job.location && <span>📍 {job.location}</span>}
            {salaryText && <span>💰 {salaryText}</span>}
            {job.publishedAt && <span>📅 Posted {new Date(job.publishedAt).toLocaleDateString()}</span>}
          </div>
          {job.description && (
            <div className="mt-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Description</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
            </div>
          )}
          {job.requirements && (
            <div className="mt-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Requirements</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{job.requirements}</p>
            </div>
          )}
          <div className="mt-8">
            <Link to={`/jobs/${job.id}/apply`} className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:from-blue-700 hover:to-purple-700 shadow-lg">
              Apply Now
            </Link>
          </div>
        </div>
      </div>
    </PageShell>
  );
}


