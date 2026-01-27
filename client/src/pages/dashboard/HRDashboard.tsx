import { useEffect, useState } from 'react';
import { useAuth } from '@/pages/auth/AuthContext';
import { getJobs } from '@/api/job';


interface DashboardStats {
  totalJobs: number;
  publishedJobs: number;
  draftJobs: number;
  totalApplicants: number;
}

interface JobWithStats {
  id: number;
  title: string;
  status: string;
  createdAt: string;
  location?: string;
  salaryRange?: string;
}

export default function HRDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalJobs: 0,
    publishedJobs: 0,
    draftJobs: 0,
    totalApplicants: 0
  });
  const [recentJobs, setRecentJobs] = useState<JobWithStats[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    setError(null);
    
    try {
      const jobs = await getJobs();
      
      const totalJobs = jobs.length;
      const publishedJobs = jobs.filter((job: any) => job.status === 'PUBLISHED').length;
      const draftJobs = jobs.filter((job: any) => job.status === 'DRAFT').length;
      
      const jobsWithStats: JobWithStats[] = jobs.map((job: any) => ({
        id: job.id,
        title: job.title,
        status: job.status,
        createdAt: job.createdAt || job.created_at || new Date().toISOString(),
        location: job.location,
        salaryRange: job.salaryRange
      }));
      
      setStats({
        totalJobs,
        publishedJobs,
        draftJobs,
        totalApplicants: 0
      });
      
      setRecentJobs(
        jobsWithStats
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5)
      );
      
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }

  const brand = {
    bgGradient: 'bg-[radial-gradient(1200px_600px_at_70%_0%,rgba(99,91,255,0.12),rgba(255,255,255,0))]',
    card: 'rounded-2xl border border-slate-200/70 bg-white/70 backdrop-blur-sm shadow-sm',
    btn: 'inline-flex items-center h-9 px-4 rounded-full bg-[#635bff] text-white font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#635bff]/30 transition',
    btnGhost: 'inline-flex items-center h-9 px-4 rounded-full border border-[#635bff]/30 text-[#635bff] bg-white hover:bg-[#635bff]/5 focus:outline-none focus:ring-2 focus:ring-[#635bff]/20 transition',
  } as const;

  const StatCard = ({ title, value, icon, color }: {
    title: string;
    value: number;
    icon: string;
    color: string;
  }) => (
    <div className={`${brand.card} p-5`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="m-0 text-sm text-slate-600">{title}</p>
          <p className="m-0 text-3xl font-bold" style={{ color }}>{value}</p>
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </div>
  );

  const JobCard = ({ job }: { job: JobWithStats }) => (
    <div className={`${brand.card} p-4`}>
      <div className="flex items-start justify-between mb-1">
        <h3 className="m-0 text-base font-semibold text-slate-900">{job.title}</h3>
        <span className={`px-2 py-1 rounded text-xs font-medium ${job.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
          {job.status}
        </span>
      </div>
      <div className="mt-1 mb-3 text-sm text-slate-600 space-y-1">
        {job.location && <div>📍 {job.location}</div>}
        {job.salaryRange && <div>💰 {job.salaryRange}</div>}
      </div>
      <div className="mt-2 text-xs text-slate-400">Created: {new Date(job.createdAt).toLocaleDateString()}</div>
    </div>
  );

  return (
      <div className={`p-6 ${brand.bgGradient}`}>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-1">
            <h1 className="m-0 text-2xl font-bold text-slate-900">HR Dashboard</h1>
          </div>
          <p className="m-0 text-slate-600">Welcome back, {user?.firstName || user?.username}! Here's your hiring overview.</p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 p-4">
            Error: {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-10 text-slate-600">Loading dashboard...</div>
        ) : (
          <>
            {/* Stat grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <StatCard title="Total Jobs" value={stats.totalJobs} icon="💼" color="#3b82f6" />
              <StatCard title="Published Jobs" value={stats.publishedJobs} icon="📢" color="#10b981" />
              <StatCard title="Draft Jobs" value={stats.draftJobs} icon="📝" color="#f59e0b" />
              <StatCard title="Total Applicants" value={stats.totalApplicants} icon="👥" color="#8b5cf6" />
            </div>

            {/* Content grid */}
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className={`${brand.card} p-6`}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-slate-900 m-0">Recent Jobs</h3>
                    <button className={brand.btnGhost} onClick={() => (window.location.href = '/jobs')}>View all</button>
                  </div>
                  <div className="mt-4">
                    {recentJobs.length === 0 ? (
                      <div className="grid place-items-center py-12 text-center">
                        <div className="h-14 w-14 rounded-2xl bg-[#635bff]/10 grid place-items-center text-3xl">💼</div>
                        <h4 className="mt-4 text-lg font-semibold text-slate-900">No jobs yet</h4>
                        <p className="mt-1 text-sm text-slate-600 max-w-md">Create your first job posting to get started. Your jobs will appear here once created.</p>
                        <div className="mt-4">
                          <button className={brand.btn} onClick={() => (window.location.href = '/jobs')}>Create job</button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {recentJobs.map((job) => (
                          <JobCard key={job.id} job={job} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className={`${brand.card} p-6`}>
                <h3 className="text-base font-semibold text-slate-900 m-0">How it works</h3>
                <ol className="mt-4 space-y-3 text-sm text-slate-700">
                  <li className="flex items-start gap-3"><span className="mt-1 h-6 w-6 shrink-0 rounded-full bg-[#635bff]/10 text-[#635bff] grid place-items-center text-xs font-semibold">1</span><div><b>Create a job</b> – define role and requirements.</div></li>
                  <li className="flex items-start gap-3"><span className="mt-1 h-6 w-6 shrink-0 rounded-full bg-[#635bff]/10 text-[#635bff] grid place-items-center text-xs font-semibold">2</span><div><b>Publish & share</b> – candidates can view and apply.</div></li>
                  <li className="flex items-start gap-3"><span className="mt-1 h-6 w-6 shrink-0 rounded-full bg-[#635bff]/10 text-[#635bff] grid place-items-center text-xs font-semibold">3</span><div><b>AI resume scoring</b> – AI analyzes resumes against your JD.</div></li>
                  <li className="flex items-start gap-3"><span className="mt-1 h-6 w-6 shrink-0 rounded-full bg-[#635bff]/10 text-[#635bff] grid place-items-center text-xs font-semibold">4</span><div><b>Manage applicants</b> – track and collaborate with your team.</div></li>
                </ol>
              </div>
            </div>
          </>
        )}
      </div>
  );
}
