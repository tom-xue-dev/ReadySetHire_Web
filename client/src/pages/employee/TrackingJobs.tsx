import { useEffect, useMemo, useState } from 'react';
import { BookmarkIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { apiRequest, getSavedJobs, saveJob, unsaveJob } from '@/api/api';
import { useAuth } from '@/pages/auth/AuthContext';
import LandingHeader from '@/components/layout/LandingHeader';
import LandingFooter from '@/components/layout/LandingFooter';
import { useI18n } from '@/contexts/I18nContext';
import { useNavigate } from 'react-router-dom';

interface Job {
  id: number;
  title: string;
  description: string;
  requirements?: string | null;
  location?: string | null;
  salaryRange?: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
  userId: number;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    username: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
  };
}

export default function TrackingJobs() {
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [searchStatus, setSearchStatus] = useState<string>('ALL');
  const [savedJobsList, setSavedJobsList] = useState<any[]>([]);
  const [savedJobIds, setSavedJobIds] = useState<Set<number>>(new Set());
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [minSalary, setMinSalary] = useState('');
  const [maxSalary, setMaxSalary] = useState('');
  const [postedWithin, setPostedWithin] = useState<string>('ALL');

  useEffect(() => {
    loadJobs();
    if (user?.id) {
      loadSavedJobs();
    }
  }, []);

  async function loadJobs() {
    setLoading(true);
    setError(null);
    try {
      // Check if user is authenticated (optional for this page)
      const token = localStorage.getItem('token');
      console.log('🔍 Checking token:', token ? `Found (length: ${token.length})` : 'Not found (public access)');

      const params = new URLSearchParams();
      // Use contains for fuzzy search on title and description
      if (searchKeyword) {
        params.append('title_contains', searchKeyword);
      }
      if (searchLocation) {
        params.append('location_contains', searchLocation);
      }
      if (searchStatus && searchStatus !== 'ALL') {
        params.append('status', searchStatus);
      }

      const queryString = params.toString();
      // Use tracking endpoint for employees to get all fields with user relation
      const url = `/jobs/tracking${queryString ? `?${queryString}` : ''}`;
      const response = await apiRequest(url);
      const data = (response as { data?: Job[] })?.data || [];
      setJobs(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to load jobs:', err);
      if (err?.message?.includes('401')) {
        setError('Authentication failed. Please log in again.');
      } else {
        setError(err?.message ?? 'Failed to load jobs');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadJobs();
  }, [searchKeyword, searchLocation, searchStatus]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // Keyword search
      if (searchKeyword && !job.title.toLowerCase().includes(searchKeyword.toLowerCase()) &&
          !job.description?.toLowerCase().includes(searchKeyword.toLowerCase())) {
        return false;
      }
      
      // Location filter
      if (searchLocation && job.location && !job.location.toLowerCase().includes(searchLocation.toLowerCase())) {
        return false;
      }
      
      // Salary range filter
      if (minSalary || maxSalary) {
        if (!job.salaryRange) return false;
        
        // Extract numbers from salary range (e.g., "$50,000 - $80,000" or "50k-80k")
        const salaryNumbers = job.salaryRange.match(/\d+/g);
        if (salaryNumbers && salaryNumbers.length >= 2) {
          const jobMinSalary = parseInt(salaryNumbers[0]) * (job.salaryRange.includes('k') ? 1000 : 1);
          const jobMaxSalary = parseInt(salaryNumbers[1]) * (job.salaryRange.includes('k') ? 1000 : 1);
          
          if (minSalary && jobMaxSalary < parseInt(minSalary)) return false;
          if (maxSalary && jobMinSalary > parseInt(maxSalary)) return false;
        }
      }
      
      // Posted within filter
      if (postedWithin !== 'ALL') {
        const jobDate = new Date(job.createdAt);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - jobDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (postedWithin === '24h' && diffDays > 1) return false;
        if (postedWithin === '7d' && diffDays > 7) return false;
        if (postedWithin === '30d' && diffDays > 30) return false;
      }
      
      return true;
    });
  }, [jobs, searchKeyword, searchLocation, minSalary, maxSalary, postedWithin]);

  async function loadSavedJobs() {
    if (!user?.id) return;
    try {
      const saved = await getSavedJobs(user.id);
      setSavedJobsList(saved);
      const jobIds = new Set(saved.map((s: any) => s.job?.id).filter(Boolean));
      setSavedJobIds(jobIds);
    } catch (err) {
      console.error('Failed to load saved jobs:', err);
    }
  }

  async function toggleSaveJob(jobId: number) {
    if (!user?.id) return;
    
    try {
      if (savedJobIds.has(jobId)) {
        await unsaveJob(user.id, jobId);
        setSavedJobIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(jobId);
          return newSet;
        });
        setSavedJobsList(prev => prev.filter((s: any) => s.job?.id !== jobId));
      } else {
        await saveJob(user.id, jobId);
        setSavedJobIds((prev) => new Set(prev).add(jobId));
        await loadSavedJobs();
      }
    } catch (err) {
      console.error('Failed to toggle save job:', err);
    }
  }

  function clearAllFilters() {
    setSearchKeyword('');
    setSearchLocation('');
    setSearchStatus('ALL');
    setMinSalary('');
    setMaxSalary('');
    setPostedWithin('ALL');
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1d ago';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return `${Math.floor(diffDays / 30)}mo ago`;
  }

  return (
    <div className="bg-white min-h-screen relative flex flex-col">
      <LandingHeader showNavLinks={false} />
      
      {/* Top background decoration - same as Home page */}
      <div aria-hidden="true" className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-[80px] sm:-top-80">
        <div
          style={{clipPath:'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)'}}
          className="relative left-1/2 aspect-1155/678 w-400 -translate-x-1/2 rotate-30 bg-linear-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 blur-3xl pointer-events-none sm:w-560"
        />
      </div>

      <div className="min-h-screen bg-transparent pt-14">
        {/* Header with Search Bar */}
        <div className="bg-linear-to-r from-indigo-600 via-purple-600 to-pink-600 relative overflow-hidden shadow-lg">
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-lg shadow-xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* What - Keywords */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('trackingJobs.jobTitle')}
                  </label>
                  <input
                    type="text"
                    placeholder={t('trackingJobs.enterKeywords')}
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>


                {/* Where - Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('trackingJobs.location')}
                  </label>
                  <input
                    type="text"
                    placeholder={t('trackingJobs.enterLocation')}
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* More Options - Collapsible */}
              {showMoreOptions && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                  {/* Salary Range - Min */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('trackingJobs.minSalary')}
                    </label>
                    <input
                      type="number"
                      placeholder="e.g., 50000"
                      value={minSalary}
                      onChange={(e) => setMinSalary(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>

                  {/* Salary Range - Max */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('trackingJobs.maxSalary')}
                    </label>
                    <input
                      type="number"
                      placeholder="e.g., 100000"
                      value={maxSalary}
                      onChange={(e) => setMaxSalary(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>

                  {/* Posted Within */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('trackingJobs.postedWithin')}
                    </label>
                    <select
                      value={postedWithin}
                      onChange={(e) => setPostedWithin(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    >
                      <option value="ALL">{t('trackingJobs.anyTime')}</option>
                      <option value="24h">{t('trackingJobs.last24h')}</option>
                      <option value="7d">{t('trackingJobs.last7d')}</option>
                      <option value="30d">{t('trackingJobs.last30d')}</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={loadJobs}
                    className="bg-pink-600 hover:bg-pink-700 text-white font-semibold px-8 py-3 rounded-md transition-colors"
                  >
                    {t('trackingJobs.search')}
                  </button>
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-gray-600 hover:text-gray-900 underline"
                  >
                    {t('trackingJobs.clearFilters')}
                  </button>
                </div>
                <button
                  onClick={() => setShowMoreOptions(!showMoreOptions)}
                  className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                >
                  {showMoreOptions ? `▲ ${t('trackingJobs.lessOptions')}` : `▼ ${t('trackingJobs.moreOptions')}`}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`grid gap-6 ${selectedJob ? "pr-112" : ""}`} style={{ gridTemplateColumns: "2fr 1fr" }}>

            {/* Job Listings */}
            <div>
              <div className="bg-white rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">{t('trackingJobs.recommended')}</h2>
                  <p className="text-sm text-gray-500 mt-1">{t('trackingJobs.jobsFound', { count: filteredJobs.length })}</p>
                </div>

                {loading ? (
                  <div className="p-8 text-center text-gray-500">{t('trackingJobs.loading')}</div>
                ) : error ? (
                  <div className="p-8 text-center text-red-500">{error}</div>
                ) : filteredJobs.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">{t('trackingJobs.noJobs')}</div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredJobs.map((job) => (
                      
                      <div
                        key={job.id}
                        className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => setSelectedJob(job)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {job.title}
                              </h3>
                              {job.status === 'PUBLISHED' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                  {t('trackingJobs.newToYou')}
                                </span>
                              )}
                            </div>

                            <div className="text-sm text-gray-600 mb-2">
                              {job.user?.firstName && job.user?.lastName
                                ? `${job.user.firstName} ${job.user.lastName}`
                                : job.user?.username || 'Unknown'}
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
                              {job.location && (
                                <span className="flex items-center gap-1">
                                  📍 {job.location}
                                </span>
                              )}
                              {job.salaryRange && (
                                <span className="flex items-center gap-1">
                                  💰 {job.salaryRange}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                📅 {formatDate(job.createdAt)}
                              </span>
                            </div>

                            {job.description && (
                              <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                                {job.description}
                              </p>
                            )}

                            {job.requirements && (
                              <ul className="text-xs text-gray-500 space-y-1">
                                {job.requirements.split('\n').slice(0, 2).map((req, idx) => (
                                  <li key={idx} className="flex items-start gap-1">
                                    <span>•</span>
                                    <span>{req}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>

                          <div className="flex flex-col items-end gap-2 ml-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSaveJob(job.id);
                              }}
                              className="p-2 text-gray-400 hover:text-pink-600 transition-colors"
                              title={savedJobIds.has(job.id) ? t('trackingJobs.unsaveJob') : t('trackingJobs.saveJob')}
                            >
                              {savedJobIds.has(job.id) ? (
                                <BookmarkSolidIcon className="w-5 h-5 text-pink-600" />
                              ) : (
                                <BookmarkIcon className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          {/* Saved Jobs Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t('savedJobs.title')}
              </h3>

              {savedJobsList.length > 0 ? (
                /* 有收藏 */
                <div className="space-y-4">
                  {savedJobsList.slice(0, 3).map((saved: any) => (
                    <div
                      key={saved.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-pink-400 transition-colors"
                    >
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {saved.job?.title}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {saved.job?.user?.firstName && saved.job?.user?.lastName
                          ? `${saved.job.user.firstName} ${saved.job.user.lastName}`
                          : saved.job?.user?.username}
                      </p>
                      <div className="text-xs text-gray-500 space-y-1">
                        {saved.job?.location && <div>📍 {saved.job.location}</div>}
                        {saved.job?.salaryRange && <div>💰 {saved.job.salaryRange}</div>}
                        <div>📅 {formatDate(saved.job?.createdAt || saved.savedAt)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* 没有收藏：占位状态 */
                <div className="text-sm text-gray-500 text-center py-8">
                  <div className="mb-2">⭐</div>
                  <p>{t('savedJobs.empty')}</p>
                </div>
              )}

              {/* 查看全部 */}
              <button
                onClick={() => navigate('/employee/saved-jobs')}
                className="mt-4 w-full text-center text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                disabled={savedJobsList.length === 0}
              >
                {t('savedJobs.viewAll', { count: savedJobsList.length })} →
              </button>
            </div>
          </div>

        </div>

          {/* Dim background when a job is selected */}
            {selectedJob && (
              <div
                className="fixed inset-0 bg-black/40 z-30"
                onClick={() => setSelectedJob(null)}
              />
            )}
            {/* Job Details Panel - Fixed Right Side */}
            {selectedJob && (
              <div className="fixed top-0 right-0 w-[25vw] min-w-[380px] max-w-[480px] h-screen bg-white shadow-2xl border-l border-gray-200 z-50 overflow-y-auto">
                <div className="p-6 space-y-4">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-900">{selectedJob.title}</h3>
                      <button
                        onClick={() => setSelectedJob(null)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>

                    {selectedJob.user && (
                      <div className="pb-4 border-b border-gray-200">
                        <div className="text-sm text-gray-600 mb-1">{t('trackingJobs.companyInfo')}</div>
                        <div className="font-semibold text-gray-900">
                          {selectedJob.user.firstName && selectedJob.user.lastName
                            ? `${selectedJob.user.firstName} ${selectedJob.user.lastName}`
                            : selectedJob.user.username}
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      {selectedJob.location && (
                        <div className="flex items-start gap-2">
                          <span className="text-gray-500">📍</span>
                          <span className="text-sm text-gray-700">{selectedJob.location}</span>
                        </div>
                      )}
                      {selectedJob.salaryRange && (
                        <div className="flex items-start gap-2">
                          <span className="text-gray-500">💰</span>
                          <span className="text-sm text-gray-700">{selectedJob.salaryRange}</span>
                        </div>
                      )}
                      <div className="flex items-start gap-2">
                        <span className="text-gray-500">📅</span>
                        <span className="text-sm text-gray-700">
                          {t('trackingJobs.postedDate')} {formatDate(selectedJob.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-2">{t('trackingJobs.description')}</h4>
                      <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                        {selectedJob.description}
                      </p>
                    </div>

                    {selectedJob.requirements && (
                      <div className="pt-4 border-t border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-2">{t('trackingJobs.requirements')}</h4>
                        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                          {selectedJob.requirements}
                        </p>
                      </div>
                    )}

                    <div className="pt-4 flex gap-2">
                      <button
                        onClick={() => {
                          // Quick apply functionality
                          window.location.href = `/jobs/${selectedJob.id}/apply`;
                        }}
                        className="flex-1 bg-pink-600 hover:bg-pink-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                      >
                        {t('trackingJobs.quickApply')}
                      </button>
                      <button
                        onClick={() => toggleSaveJob(selectedJob.id)}
                        className={`px-4 py-3 rounded-lg border transition-colors ${
                          savedJobIds.has(selectedJob.id)
                            ? 'bg-pink-50 border-pink-600 text-pink-600'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                        title={savedJobIds.has(selectedJob.id) ? t('trackingJobs.unsaveJob') : t('trackingJobs.saveJob')}
                      >
                        {savedJobIds.has(selectedJob.id) ? (
                          <BookmarkSolidIcon className="w-5 h-5" />
                        ) : (
                          <BookmarkIcon className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
        </div>
      </div>
      
      <LandingFooter />
    </div>
  );
}
