import { useEffect, useMemo, useState } from 'react';
import { BookmarkIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { apiRequest } from '@/api/api';
import LandingHeader from '@/components/layout/LandingHeader';
import LandingFooter from '@/components/layout/LandingFooter';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [searchStatus, setSearchStatus] = useState<string>('ALL');
  const [savedJobs, setSavedJobs] = useState<Set<number>>(new Set());
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [minSalary, setMinSalary] = useState('');
  const [maxSalary, setMaxSalary] = useState('');
  const [postedWithin, setPostedWithin] = useState<string>('ALL');

  useEffect(() => {
    loadJobs();
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

  function toggleSaveJob(jobId: number) {
    setSavedJobs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
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
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 relative overflow-hidden shadow-lg">
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-lg shadow-xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* What - Keywords */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Title
                  </label>
                  <input
                    type="text"
                    placeholder="Enter keywords"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>


                {/* Where - Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="Enter suburb, city, or region"
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
                      Min Salary ($)
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
                      Max Salary ($)
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
                      Posted Within
                    </label>
                    <select
                      value={postedWithin}
                      onChange={(e) => setPostedWithin(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    >
                      <option value="ALL">Any time</option>
                      <option value="24h">Last 24 hours</option>
                      <option value="7d">Last 7 days</option>
                      <option value="30d">Last 30 days</option>
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
                    SEARCH
                  </button>
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-gray-600 hover:text-gray-900 underline"
                  >
                    Clear all filters
                  </button>
                </div>
                <button
                  onClick={() => setShowMoreOptions(!showMoreOptions)}
                  className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                >
                  {showMoreOptions ? '▲ Less options' : '▼ More options'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Job Listings - Left Side */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Recommended</h2>
                  <p className="text-sm text-gray-500 mt-1">{filteredJobs.length} job(s) found</p>
                </div>

                {loading ? (
                  <div className="p-8 text-center text-gray-500">Loading jobs...</div>
                ) : error ? (
                  <div className="p-8 text-center text-red-500">{error}</div>
                ) : filteredJobs.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">No jobs found</div>
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
                                  New to you
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
                              title={savedJobs.has(job.id) ? 'Unsave job' : 'Save job'}
                            >
                              {savedJobs.has(job.id) ? (
                                <BookmarkSolidIcon className="w-5 h-5 text-pink-600" />
                              ) : (
                                <BookmarkIcon className="w-5 h-5" />
                              )}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // Hide job functionality
                              }}
                              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                              title="Hide job"
                            >
                              <XMarkIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="lg:col-span-1">
              <div className="space-y-6">
                {/* Saved Searches */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Saved searches</h3>
                  <p className="text-sm text-gray-600">
                    Use the Save search button below the search results to save your search and receive every new job.
                  </p>
                </div>

                {/* Saved Jobs */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Saved jobs</h3>
                  <p className="text-sm text-gray-600">
                    Use the Save button on each job listing to save it for later. You can then access them on all your devices.
                  </p>
                  {savedJobs.size > 0 && (
                    <div className="mt-4 text-sm text-pink-600">
                      {savedJobs.size} job(s) saved
                    </div>
                  )}
                </div>

                {/* Job Details Panel */}
                {selectedJob && (
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Details</h3>
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Title:</span>
                        <p className="text-gray-900">{selectedJob.title}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Description:</span>
                        <p className="text-gray-600">{selectedJob.description}</p>
                      </div>
                      {selectedJob.requirements && (
                        <div>
                          <span className="font-medium text-gray-700">Requirements:</span>
                          <p className="text-gray-600">{selectedJob.requirements}</p>
                        </div>
                      )}
                      {selectedJob.location && (
                        <div>
                          <span className="font-medium text-gray-700">Location:</span>
                          <p className="text-gray-600">{selectedJob.location}</p>
                        </div>
                      )}
                      {selectedJob.salaryRange && (
                        <div>
                          <span className="font-medium text-gray-700">Salary Range:</span>
                          <p className="text-gray-600">{selectedJob.salaryRange}</p>
                        </div>
                      )}
                      <div>
                        <span className="font-medium text-gray-700">Status:</span>
                        <p className="text-gray-600">{selectedJob.status}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Created:</span>
                        <p className="text-gray-600">{new Date(selectedJob.createdAt).toLocaleDateString()}</p>
                      </div>
                      {selectedJob.publishedAt && (
                        <div>
                          <span className="font-medium text-gray-700">Published:</span>
                          <p className="text-gray-600">{new Date(selectedJob.publishedAt).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <LandingFooter />
    </div>
  );
}
