import { useEffect, useState } from 'react';
import { BookmarkIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import { getSavedJobs, unsaveJob } from '@/api/api';
import { useAuth } from '@/pages/auth/AuthContext';
import LandingHeader from '@/components/layout/LandingHeader';
import LandingFooter from '@/components/layout/LandingFooter';
import { useI18n } from '@/contexts/I18nContext';

interface SavedJobItem {
  id: number;
  savedAt: string;
  job: {
    id: number;
    title: string;
    description: string;
    location?: string | null;
    salaryRange?: string | null;
    status: string;
    createdAt: string;
    user?: {
      firstName?: string | null;
      lastName?: string | null;
      username: string;
    };
  };
}

export default function SavedJobs() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [savedJobs, setSavedJobs] = useState<SavedJobItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'saved' | 'applied'>('saved');

  useEffect(() => {
    loadSavedJobs();
  }, []);

  async function loadSavedJobs() {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    try {
      const saved = await getSavedJobs(user.id);
      setSavedJobs(saved as SavedJobItem[]);
    } catch (err: any) {
      setError(err?.message || 'Failed to load saved jobs');
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(jobId: number) {
    if (!user?.id) return;
    
    try {
      await unsaveJob(user.id, jobId);
      setSavedJobs(prev => prev.filter(s => s.job.id !== jobId));
      setOpenMenuId(null);
    } catch (err) {
      console.error('Failed to remove saved job:', err);
      alert(t('savedJobs.removedError'));
    }
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
      
      {/* Top background decoration */}
      <div aria-hidden="true" className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-[80px] sm:-top-80">
        <div
          style={{clipPath:'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)'}}
          className="relative left-1/2 aspect-1155/678 w-400 -translate-x-1/2 rotate-30 bg-linear-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 blur-3xl pointer-events-none sm:w-560"
        />
      </div>

      <div className="min-h-screen bg-transparent pt-14">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 relative overflow-hidden shadow-lg">
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-3 mb-3">
                <BookmarkIcon className="w-10 h-10 text-white" />
                <h1 className="text-3xl font-bold text-white">{t('savedJobs.title')}</h1>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Tabs */}
          <div className="flex gap-8 border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab('saved')}
              className={`pb-4 text-sm font-medium transition-colors relative ${
                activeTab === 'saved'
                  ? 'text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <BookmarkIcon className="w-4 h-4" />
                {t('savedJobs.saved')}
              </div>
              {activeTab === 'saved' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('applied')}
              className={`pb-4 text-sm font-medium transition-colors relative ${
                activeTab === 'applied'
                  ? 'text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('savedJobs.applied')}
              {activeTab === 'applied' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"></div>
              )}
            </button>
          </div>

          {/* Job Count */}
          <p className="text-sm text-gray-600 mb-6">
            {savedJobs.length} {savedJobs.length === 1 ? 'job' : 'jobs'}
          </p>

          {/* Job List */}
          {loading ? (
            <div className="text-center py-12 text-gray-500">{t('trackingJobs.loading')}</div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">{error}</div>
          ) : savedJobs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">{t('savedJobs.noSavedJobs')}</div>
          ) : (
            <div className="space-y-4">
              {savedJobs.map((saved) => (
                <div key={saved.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Status Badge */}
                      {saved.job.status !== 'PUBLISHED' && (
                        <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded mb-2">
                          Expired
                        </span>
                      )}
                      
                      {/* Job Title */}
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:underline cursor-pointer">
                        {saved.job.title}
                      </h3>
                      
                      {/* Company Name */}
                      <p className="text-sm text-gray-600 mb-3">
                        {saved.job.user?.firstName && saved.job.user?.lastName
                          ? `${saved.job.user.firstName} ${saved.job.user.lastName}`
                          : saved.job.user?.username}
                      </p>
                      
                      {/* Posted Date */}
                      <p className="text-sm text-gray-500 mb-3">
                        Posted {formatDate(saved.job.createdAt)}
                      </p>
                      
                      {/* Location and Salary */}
                      <div className="space-y-1 text-sm text-gray-700">
                        {saved.job.location && <div>📍 {saved.job.location}</div>}
                        {saved.job.salaryRange && <div>💰 {saved.job.salaryRange}</div>}
                      </div>
                      
                      {/* Description Preview */}
                      {saved.job.description && (
                        <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                          {saved.job.description}
                        </p>
                      )}
                    </div>

                    {/* Action Menu */}
                    <div className="relative ml-4">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === saved.id ? null : saved.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <EllipsisVerticalIcon className="w-5 h-5 text-gray-600" />
                      </button>
                      
                      {openMenuId === saved.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setOpenMenuId(null)}
                          />
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                            <button
                              onClick={() => handleRemove(saved.job.id)}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                            >
                              {t('savedJobs.remove')}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <LandingFooter />
    </div>
  );
}
