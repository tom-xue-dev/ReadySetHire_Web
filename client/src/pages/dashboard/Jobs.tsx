import { useEffect, useState, useMemo } from 'react';
import { BriefcaseIcon, MagnifyingGlassIcon, FunnelIcon, EllipsisVerticalIcon, ArrowsUpDownIcon } from '@heroicons/react/24/outline';
import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/pages/auth/AuthContext';
import { getJobs } from '@/api/job';
import { apiRequest } from '@/api/api';

interface Job {
  id: number;
  title: string;
  description: string;
  requirements?: string;
  location?: string;
  salaryRange?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
  userId: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    firstName?: string;
    lastName?: string;
    username: string;
  };
  _count?: {
    jobApplications: number;
  };
}

interface ApplicationStats {
  total: number;
  submitted: number;
  inReview: number;
  interviewed: number;
  offerExtended: number;
}

export default function Jobs() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applicationStats, setApplicationStats] = useState<ApplicationStats>({
    total: 0,
    submitted: 0,
    inReview: 0,
    interviewed: 0,
    offerExtended: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DRAFT' | 'PUBLISHED' | 'CLOSED'>('ALL');
  const [updateTimeFilter, setUpdateTimeFilter] = useState<'ALL' | '1DAY' | '7DAYS' | '1MONTH'>('ALL');
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'title'>('updated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [showJobModal, setShowJobModal] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [jobForm, setJobForm] = useState({
    title: '',
    description: '',
    requirements: '',
    location: '',
    salaryRange: ''
  });

  useEffect(() => {
    loadJobs();
    loadApplicationStats();
  }, []);

  async function loadJobs() {
    setLoading(true);
    try {
      const data = await getJobs();
      setJobs(data as Job[]);
    } catch (err) {
      console.error('Failed to load jobs:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadApplicationStats() {
    try {
      const response = await apiRequest('/job-applications/stats');
      if (response && typeof response === 'object') {
        const data = response as any;
        setApplicationStats({
          total: data.total || 0,
          submitted: data.byStatus?.SUBMITTED || 0,
          inReview: data.byStatus?.IN_REVIEW || 0,
          interviewed: data.byStatus?.INTERVIEWED || 0,
          offerExtended: data.byStatus?.OFFER_EXTENDED || 0
        });
      }
    } catch (err) {
      console.error('Failed to load application stats:', err);
    }
  }

  const filteredAndSortedJobs = useMemo(() => {
    let filtered = jobs.filter(job => {
      const matchesSearch = !searchQuery || 
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.location?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'ALL' || job.status === statusFilter;
      
      let matchesTime = true;
      if (updateTimeFilter !== 'ALL') {
        const updatedDate = new Date(job.updatedAt);
        const now = new Date();
        const diffMs = now.getTime() - updatedDate.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        
        if (updateTimeFilter === '1DAY') matchesTime = diffDays <= 1;
        else if (updateTimeFilter === '7DAYS') matchesTime = diffDays <= 7;
        else if (updateTimeFilter === '1MONTH') matchesTime = diffDays <= 30;
      }
      
      return matchesSearch && matchesStatus && matchesTime;
    });

    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'updated') {
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      } else if (sortBy === 'created') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === 'title') {
        comparison = a.title.localeCompare(b.title);
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [jobs, searchQuery, statusFilter, updateTimeFilter, sortBy, sortOrder]);

  const stats = useMemo(() => {
    return {
      openJobs: jobs.filter(j => j.status === 'PUBLISHED').length,
      newApplicants: applicationStats.submitted,
      inReview: applicationStats.inReview,
      interviewing: applicationStats.interviewed,
      offers: applicationStats.offerExtended
    };
  }, [jobs, applicationStats]);

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return t('date.relative.justNow');
    if (diffHours < 24) return t('date.relative.hoursAgo', { hours: diffHours });
    if (diffHours < 48) return t('date.relative.daysAgo', { days: 1 });
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return t('date.relative.daysAgo', { days: diffDays });
    return date.toLocaleDateString();
  }

  function getStatusLabel(status: Job['status']) {
    return t(`jobs.statusValues.${status}`);
  }

  function getStatusBadge(status: string) {
    const styles: Record<string, string> = {
      PUBLISHED: 'bg-green-100 text-green-700',
      DRAFT: 'bg-gray-100 text-gray-700',
      CLOSED: 'bg-red-100 text-red-700',
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  }

  function exportToCSV() {
    const headers = [
      t('jobs.csv.title'),
      t('jobs.csv.location'),
      t('jobs.csv.salaryRange'),
      t('jobs.csv.status'),
      t('jobs.csv.applicants'),
      t('jobs.csv.created'),
      t('jobs.csv.updated'),
    ];
    const rows = filteredAndSortedJobs.map(job => [
      job.title,
      job.location || '',
      job.salaryRange || '',
      getStatusLabel(job.status),
      job._count?.jobApplications || 0,
      job.createdAt,
      job.updatedAt
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `jobs_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }

  function openJobModal(job?: Job) {
    if (job) {
      setEditingJob(job);
      setJobForm({
        title: job.title,
        description: job.description,
        requirements: job.requirements || '',
        location: job.location || '',
        salaryRange: job.salaryRange || ''
      });
    } else {
      setEditingJob(null);
      setJobForm({
        title: '',
        description: '',
        requirements: '',
        location: '',
        salaryRange: ''
      });
    }
    setShowJobModal(true);
  }

  async function handleSaveJob() {
    if (!jobForm.title || !jobForm.description) {
      alert(t('jobs.validation.titleAndDescriptionRequired'));
      return;
    }

    try {
      const jobData = {
        ...jobForm,
        userId: user?.id
      };

      if (editingJob) {
        await apiRequest(`/jobs/${editingJob.id}`, 'PATCH', jobData as any);
      } else {
        await apiRequest('/jobs', 'POST', jobData as any);
      }

      setShowJobModal(false);
      setEditingJob(null);
      loadJobs();
    } catch (err) {
      console.error('Failed to save job:', err);
      alert(t('jobs.errors.saveFailed'));
    }
  }

  async function handleDeleteJob(jobId: number) {
    if (!window.confirm(t('jobs.confirm.deleteJob'))) return;
    
    try {
      await apiRequest(`/jobs/${jobId}`, 'DELETE');
      loadJobs();
      setOpenMenuId(null);
    } catch (err) {
      console.error('Failed to delete job:', err);
      alert(t('jobs.errors.deleteFailed'));
    }
  }

  async function handlePublishJob(jobId: number) {
    try {
      await apiRequest(`/jobs/${jobId}/publish`, 'PATCH');
      loadJobs();
      setOpenMenuId(null);
    } catch (err) {
      console.error('Failed to publish job:', err);
      alert(t('jobs.errors.publishFailed'));
    }
  }

  async function handleCloseJob(jobId: number) {
    try {
      await apiRequest(`/jobs/${jobId}`, 'PATCH', { status: 'CLOSED' } as any);
      loadJobs();
      setOpenMenuId(null);
    } catch (err) {
      console.error('Failed to close job:', err);
      alert(t('jobs.errors.closeFailed'));
    }
  }

  function handleShareJob(jobId: number) {
    const applyUrl = `${window.location.origin}/jobs/${jobId}/apply`;
    navigator.clipboard.writeText(applyUrl).then(() => {
      alert(t('jobs.share.copied'));
      setOpenMenuId(null);
    }).catch(() => {
      alert(t('jobs.share.copyFailed'));
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <BriefcaseIcon className="w-8 h-8 text-indigo-600" />
              <h1 className="text-3xl font-bold text-gray-900">{t('jobs.title')}</h1>
            </div>
            <p className="text-gray-600">{t('jobs.subtitle')}</p>
          </div>
          <button 
            onClick={() => openJobModal()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            {t('jobs.newJob')}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">{t('jobs.stats.openJobs')}</span>
              <BriefcaseIcon className="w-5 h-5 text-gray-400" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.openJobs}</div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">{t('jobs.stats.newApplicants')}</span>
              <span className="text-xs text-gray-500">(?%)</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.newApplicants}</div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">{t('jobs.stats.inReview')}</span>
              <span className="text-gray-400">❄️</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.inReview}</div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">{t('jobs.stats.interviewing')}</span>
              <span className="text-gray-400">💬</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.interviewing}</div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">{t('jobs.stats.offers')}</span>
              <span className="text-gray-400">📄</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.offers}</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('jobs.searchPlaceholder')}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          
          <div className="relative">
            <button 
              onClick={() => {
                setShowFilters(!showFilters);
                setShowSort(false);
              }}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <FunnelIcon className="w-4 h-4" />
              {t('jobs.filters')}
            </button>
            {showFilters && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowFilters(false)} />
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-20">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('jobs.status')}</label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="ALL">{t('jobs.all')}</option>
                        <option value="DRAFT">{t('jobs.draft')}</option>
                        <option value="PUBLISHED">{t('jobs.open')}</option>
                        <option value="CLOSED">{t('jobs.closed')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('jobs.updateTime')}</label>
                      <select
                        value={updateTimeFilter}
                        onChange={(e) => setUpdateTimeFilter(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="ALL">{t('jobs.updateTimeOptions.all')}</option>
                        <option value="1DAY">{t('jobs.updateTimeOptions.last24h')}</option>
                        <option value="7DAYS">{t('jobs.updateTimeOptions.last7d')}</option>
                        <option value="1MONTH">{t('jobs.updateTimeOptions.last30d')}</option>
                      </select>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="relative">
            <button 
              onClick={() => {
                setShowSort(!showSort);
                setShowFilters(false);
              }}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <ArrowsUpDownIcon className="w-4 h-4" />
              {t('jobs.sort')}
            </button>
            {showSort && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowSort(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                  <button
                    onClick={() => { setSortBy('updated'); setSortOrder('desc'); setShowSort(false); }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {t('jobs.sortOptions.updatedNewest')}
                  </button>
                  <button
                    onClick={() => { setSortBy('updated'); setSortOrder('asc'); setShowSort(false); }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {t('jobs.sortOptions.updatedOldest')}
                  </button>
                  <button
                    onClick={() => { setSortBy('created'); setSortOrder('desc'); setShowSort(false); }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {t('jobs.sortOptions.createdNewest')}
                  </button>
                  <button
                    onClick={() => { setSortBy('title'); setSortOrder('asc'); setShowSort(false); }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {t('jobs.sortOptions.titleAZ')}
                  </button>
                </div>
              </>
            )}
          </div>

          <button 
            onClick={exportToCSV}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            {t('jobs.export')}
          </button>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 mb-6">
          {(['ALL', 'DRAFT', 'OPEN', 'CLOSED'] as const).map((status) => (
            <button
              key={status}
              onClick={() =>
                setStatusFilter(status === 'OPEN' ? 'PUBLISHED' : status)
              }
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                (status === 'OPEN' && statusFilter === 'PUBLISHED') ||
                (status !== 'OPEN' && statusFilter === status)
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {t(`jobs.${status.toLowerCase()}`)}
            </button>
          ))}
        </div>


        {/* Jobs Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-visible">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input type="checkbox" className="rounded border-gray-300" />
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">{t('jobs.role')}</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">{t('jobs.status')}</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">{t('jobs.applicants')}</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">{t('jobs.hiringManager')}</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">{t('jobs.updated')}</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    {t('trackingJobs.loading')}
                  </td>
                </tr>
              ) : filteredAndSortedJobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    {t('trackingJobs.noJobs')}
                  </td>
                </tr>
              ) : (
                filteredAndSortedJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input type="checkbox" className="rounded border-gray-300" />
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-gray-900">{job.title}</div>
                        <div className="text-sm text-gray-500 mt-1">
                          {job.location && <span>📍 {job.location}</span>}
                          {job.location && job.salaryRange && <span> • </span>}
                          {job.salaryRange && <span>{job.salaryRange}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${getStatusBadge(job.status)}`}>
                        {getStatusLabel(job.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-gray-900">{job._count?.jobApplications ?? 0}</div>
                        <div className="text-xs text-gray-500">{t('jobs.applicantsCount')}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm text-gray-900">
                          {job.user?.firstName && job.user?.lastName
                            ? `${job.user.firstName} ${job.user.lastName}`
                            : job.user?.username || user?.username}
                        </div>
                        <div className="text-xs text-gray-500">{t('jobs.accountId', { id: job.userId })}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(job.updatedAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === job.id ? null : job.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <EllipsisVerticalIcon className="w-5 h-5 text-gray-600" />
                        </button>
                        
                        {openMenuId === job.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setOpenMenuId(null)}
                            />
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-40">
                              <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                                <span>👁️</span>
                                {t('jobs.viewPipeline')}
                              </button>
                              <button 
                                onClick={() => { openJobModal(job); setOpenMenuId(null); }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                              >
                                <span>✏️</span>
                                {t('jobs.editJob')}
                              </button>
                              
                              {job.status === 'DRAFT' && (
                                <>
                                  <button 
                                    onClick={() => handlePublishJob(job.id)}
                                    className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50 flex items-center gap-2"
                                  >
                                    <span>📢</span>
                                    {t('jobs.publish')}
                                  </button>
                                  <button 
                                    onClick={() => handleCloseJob(job.id)}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                  >
                                    <span>🔒</span>
                                    {t('jobs.close')}
                                  </button>
                                </>
                              )}
                              
                              {job.status === 'PUBLISHED' && (
                                <>
                                  <button 
                                    onClick={() => handleShareJob(job.id)}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                  >
                                    <span>🔗</span>
                                    {t('jobs.shareLink')}
                                  </button>
                                  <button 
                                    onClick={() => handleCloseJob(job.id)}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                  >
                                    <span>🔒</span>
                                    {t('jobs.close')}
                                  </button>
                                </>
                              )}
                              
                              <button 
                                onClick={() => handleDeleteJob(job.id)}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <span>🗑️</span>
                                {t('jobs.delete')}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          
          {/* Footer */}
          <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between text-sm text-gray-600">
            <div>{t('jobs.showingJobs', { count: filteredAndSortedJobs.length })}</div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 rounded hover:bg-gray-100">{t('pagination.previous')}</button>
              <button className="px-3 py-1 bg-indigo-600 text-white rounded">1</button>
              <button className="px-3 py-1 rounded hover:bg-gray-100">{t('pagination.next')}</button>
            </div>
          </div>
        </div>

        {/* Job Modal */}
        {showJobModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingJob ? t('jobs.modal.editTitle') : t('jobs.newJob')}
                </h2>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('jobs.form.title')} *</label>
                  <input
                    type="text"
                    value={jobForm.title}
                    onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder={t('jobs.form.titlePlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('jobs.form.description')} *</label>
                  <textarea
                    value={jobForm.description}
                    onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                    rows={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder={t('jobs.form.descriptionPlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('jobs.form.requirements')}</label>
                  <textarea
                    value={jobForm.requirements}
                    onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder={t('jobs.form.requirementsPlaceholder')}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('jobs.form.location')}</label>
                    <input
                      type="text"
                      value={jobForm.location}
                      onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder={t('jobs.form.locationPlaceholder')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('jobs.form.salaryRange')}</label>
                    <input
                      type="text"
                      value={jobForm.salaryRange}
                      onChange={(e) => setJobForm({ ...jobForm, salaryRange: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder={t('jobs.form.salaryRangePlaceholder')}
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  onClick={() => { setShowJobModal(false); setEditingJob(null); }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {t('forms.cancel')}
                </button>
                <button
                  onClick={handleSaveJob}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  {editingJob ? t('forms.save') : t('jobs.modal.create')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
