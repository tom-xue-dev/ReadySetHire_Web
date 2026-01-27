import { useState, useEffect, useMemo } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { apiRequest } from '../../api/api';
import { getJobs } from '../../api/job';
import {
  ChevronDownIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  EnvelopeIcon,
  PhoneIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

// Application Status enum matching backend
type ApplicationStatus =
  | 'SUBMITTED'
  | 'IN_REVIEW'
  | 'SHORTLISTED'
  | 'INTERVIEW_SCHEDULED'
  | 'INTERVIEWED'
  | 'OFFER_EXTENDED'
  | 'HIRED'
  | 'REJECTED'
  | 'WITHDRAWN';

interface Job {
  id: number;
  title: string;
  location?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Application {
  id: number;
  jobId: number;
  candidateId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  status: ApplicationStatus;
  source?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  job?: Job;
}

// Stage configuration with colors and order
const STAGE_CONFIG: {
  key: ApplicationStatus;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}[] = [
  { key: 'SUBMITTED', colorClass: 'text-blue-700', bgClass: 'bg-blue-50', borderClass: 'border-blue-200' },
  { key: 'IN_REVIEW', colorClass: 'text-yellow-700', bgClass: 'bg-yellow-50', borderClass: 'border-yellow-200' },
  { key: 'SHORTLISTED', colorClass: 'text-cyan-700', bgClass: 'bg-cyan-50', borderClass: 'border-cyan-200' },
  { key: 'INTERVIEW_SCHEDULED', colorClass: 'text-purple-700', bgClass: 'bg-purple-50', borderClass: 'border-purple-200' },
  { key: 'INTERVIEWED', colorClass: 'text-indigo-700', bgClass: 'bg-indigo-50', borderClass: 'border-indigo-200' },
  { key: 'OFFER_EXTENDED', colorClass: 'text-orange-700', bgClass: 'bg-orange-50', borderClass: 'border-orange-200' },
  { key: 'HIRED', colorClass: 'text-green-700', bgClass: 'bg-green-50', borderClass: 'border-green-200' },
  { key: 'REJECTED', colorClass: 'text-red-700', bgClass: 'bg-red-50', borderClass: 'border-red-200' },
  { key: 'WITHDRAWN', colorClass: 'text-gray-700', bgClass: 'bg-gray-50', borderClass: 'border-gray-200' },
];

// Get next stages for a given status
function getNextStages(currentStatus: ApplicationStatus): ApplicationStatus[] {
  const stageOrder: ApplicationStatus[] = [
    'SUBMITTED',
    'IN_REVIEW',
    'SHORTLISTED',
    'INTERVIEW_SCHEDULED',
    'INTERVIEWED',
    'OFFER_EXTENDED',
    'HIRED',
  ];
  const currentIndex = stageOrder.indexOf(currentStatus);
  
  // Can always reject or withdraw
  const availableStages: ApplicationStatus[] = [];
  
  // Forward progression
  if (currentIndex >= 0 && currentIndex < stageOrder.length - 1) {
    for (let i = currentIndex + 1; i < stageOrder.length; i++) {
      availableStages.push(stageOrder[i]);
    }
  }
  
  // Can always reject (if not already rejected/withdrawn/hired)
  if (!['REJECTED', 'WITHDRAWN', 'HIRED'].includes(currentStatus)) {
    availableStages.push('REJECTED');
  }
  
  return availableStages;
}

export default function Pipeline() {
  const { t } = useI18n();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showJobDropdown, setShowJobDropdown] = useState(false);
  const [activeStageFilter, setActiveStageFilter] = useState<ApplicationStatus | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Load jobs on mount
  useEffect(() => {
    async function loadJobs() {
      try {
        const jobsData = await getJobs();
        const publishedJobs = (jobsData as Job[]).filter(job => job.status === 'PUBLISHED');
        setJobs(publishedJobs);
        if (publishedJobs.length > 0) {
          setSelectedJobId(publishedJobs[0].id);
        }
      } catch (error) {
        console.error('Failed to load jobs:', error);
      }
    }
    loadJobs();
  }, []);

  // Load applications when job changes
  useEffect(() => {
    async function loadApplications() {
      if (!selectedJobId) {
        setApplications([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await apiRequest(`/jobs/${selectedJobId}/applications`);
        if (response && 'applications' in response) {
          setApplications(response.applications as Application[]);
        }
      } catch (error) {
        console.error('Failed to load applications:', error);
        setApplications([]);
      } finally {
        setLoading(false);
      }
    }
    loadApplications();
  }, [selectedJobId]);

  // Get selected job
  const selectedJob = useMemo(() => {
    return jobs.find(job => job.id === selectedJobId) || null;
  }, [jobs, selectedJobId]);

  // Group applications by stage
  const applicationsByStage = useMemo(() => {
    const grouped: Record<ApplicationStatus, Application[]> = {
      SUBMITTED: [],
      IN_REVIEW: [],
      SHORTLISTED: [],
      INTERVIEW_SCHEDULED: [],
      INTERVIEWED: [],
      OFFER_EXTENDED: [],
      HIRED: [],
      REJECTED: [],
      WITHDRAWN: [],
    };

    let filteredApps = applications;
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredApps = filteredApps.filter(
        app =>
          app.firstName.toLowerCase().includes(query) ||
          app.lastName.toLowerCase().includes(query) ||
          app.email.toLowerCase().includes(query)
      );
    }

    filteredApps.forEach(app => {
      if (grouped[app.status]) {
        grouped[app.status].push(app);
      }
    });

    return grouped;
  }, [applications, searchQuery]);

  // Stage counts for flow visualization
  const stageCounts = useMemo(() => {
    const counts: Record<ApplicationStatus, number> = {
      SUBMITTED: 0,
      IN_REVIEW: 0,
      SHORTLISTED: 0,
      INTERVIEW_SCHEDULED: 0,
      INTERVIEWED: 0,
      OFFER_EXTENDED: 0,
      HIRED: 0,
      REJECTED: 0,
      WITHDRAWN: 0,
    };
    applications.forEach(app => {
      counts[app.status]++;
    });
    return counts;
  }, [applications]);

  // Update application status
  async function updateApplicationStatus(applicationId: number, newStatus: ApplicationStatus) {
    setUpdatingStatus(true);
    try {
      const response = await apiRequest(`/applications/${applicationId}/status`, 'PATCH', {
        status: newStatus,
      });
      
      if (response && response.success) {
        // Update local state
        setApplications(prev =>
          prev.map(app =>
            app.id === applicationId ? { ...app, status: newStatus } : app
          )
        );
        
        // Update selected application if it's the one being updated
        if (selectedApplication?.id === applicationId) {
          setSelectedApplication(prev => prev ? { ...prev, status: newStatus } : null);
        }
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setUpdatingStatus(false);
    }
  }

  // Main flow stages (excluding rejected/withdrawn for the flow diagram)
  const flowStages: ApplicationStatus[] = [
    'SUBMITTED',
    'IN_REVIEW',
    'SHORTLISTED',
    'INTERVIEW_SCHEDULED',
    'INTERVIEWED',
    'OFFER_EXTENDED',
    'HIRED',
  ];

  // Kanban stages to display (based on filter or all)
  const kanbanStages = activeStageFilter
    ? [activeStageFilter]
    : STAGE_CONFIG.map(s => s.key);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-gray-900">{t('pipeline.title')}</h1>
            
            {/* Job Selector */}
            <div className="relative">
              <button
                onClick={() => setShowJobDropdown(!showJobDropdown)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white font-medium text-sm">
                  {selectedJob?.title?.charAt(0) || 'J'}
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900 text-sm">
                    {selectedJob?.title || t('pipeline.selectJob')}
                  </div>
                  <div className="text-xs text-gray-500">{selectedJob?.location || ''}</div>
                </div>
                <ChevronDownIcon className="w-4 h-4 text-gray-400" />
              </button>

              {showJobDropdown && (
                <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-auto">
                  {jobs.map(job => (
                    <button
                      key={job.id}
                      onClick={() => {
                        setSelectedJobId(job.id);
                        setShowJobDropdown(false);
                        setSelectedApplication(null);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left ${
                        job.id === selectedJobId ? 'bg-purple-50' : ''
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white font-medium text-sm">
                        {job.title.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{job.title}</div>
                        <div className="text-xs text-gray-500">{job.location}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Candidates count */}
            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
              {applications.length} {t('pipeline.candidates')}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">
              {t('pipeline.jobSettings')}
            </button>
            <button className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">
              {t('pipeline.inviteCandidates')}
            </button>
            <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium">
              {t('pipeline.addCandidate')}
            </button>
          </div>
        </div>
      </div>

      {/* Hiring Flow - Stage Distribution */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="mb-3">
          <h2 className="text-sm font-medium text-gray-900">{t('pipeline.hiringFlow')}</h2>
          <p className="text-xs text-gray-500">{t('pipeline.stageDistribution')}</p>
        </div>

        {/* Flow Diagram with Arrows */}
        <div className="flex items-stretch gap-0 overflow-x-auto pb-2">
          {flowStages.map((stage, index) => {
            const config = STAGE_CONFIG.find(s => s.key === stage)!;
            const count = stageCounts[stage];
            const isActive = activeStageFilter === stage;
            const isLast = index === flowStages.length - 1;

            return (
              <div key={stage} className="flex items-stretch">
                <button
                  onClick={() => setActiveStageFilter(isActive ? null : stage)}
                  className={`relative flex-1 min-w-[140px] px-4 py-3 border rounded-lg transition-all ${
                    isActive
                      ? `${config.bgClass} ${config.borderClass} ring-2 ring-offset-1 ring-purple-400`
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${config.colorClass}`}>
                      {t(`pipeline.stages.${stage}`)}
                    </span>
                    <span className={`text-lg font-semibold ${config.colorClass}`}>{count}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 text-left">
                    {t(`pipeline.stageDesc.${stage}`)}
                  </div>
                </button>
                
                {/* Arrow connector */}
                {!isLast && (
                  <div className="flex items-center px-1">
                    <ChevronRightIcon className="w-5 h-5 text-gray-300" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Rejected/Withdrawn - separate section */}
          <div className="flex items-center ml-4 pl-4 border-l border-gray-200">
            {(['REJECTED', 'WITHDRAWN'] as ApplicationStatus[]).map(stage => {
              const config = STAGE_CONFIG.find(s => s.key === stage)!;
              const count = stageCounts[stage];
              const isActive = activeStageFilter === stage;

              return (
                <button
                  key={stage}
                  onClick={() => setActiveStageFilter(isActive ? null : stage)}
                  className={`min-w-[120px] px-4 py-3 border rounded-lg transition-all mr-2 ${
                    isActive
                      ? `${config.bgClass} ${config.borderClass} ring-2 ring-offset-1 ring-purple-400`
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${config.colorClass}`}>
                      {t(`pipeline.stages.${stage}`)}
                    </span>
                    <span className={`text-lg font-semibold ${config.colorClass}`}>{count}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-2 text-center">
          {t('pipeline.clickToFilter')}
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('pipeline.searchPlaceholder')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          {activeStageFilter && (
            <button
              onClick={() => setActiveStageFilter(null)}
              className="flex items-center gap-1 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm"
            >
              {t(`pipeline.stages.${activeStageFilter}`)}
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content - Kanban Board */}
      <div className="flex flex-1 overflow-hidden">
        {/* Kanban Columns */}
        <div className="flex-1 overflow-x-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <div className="flex gap-4 min-h-[calc(100vh-340px)]">
              {kanbanStages.map(stage => {
                const config = STAGE_CONFIG.find(s => s.key === stage)!;
                const stageApps = applicationsByStage[stage];

                return (
                  <div
                    key={stage}
                    className="shrink-0 w-72 bg-gray-100 rounded-lg"
                  >
                    {/* Column Header */}
                    <div className={`px-3 py-2 border-b ${config.borderClass} ${config.bgClass} rounded-t-lg`}>
                      <div className="flex items-center justify-between">
                        <span className={`font-medium text-sm ${config.colorClass}`}>
                          {t(`pipeline.stages.${stage}`)}
                        </span>
                        <span className={`text-sm ${config.colorClass}`}>({stageApps.length})</span>
                      </div>
                    </div>

                    {/* Cards */}
                    <div className="p-2 space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto">
                      {stageApps.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 text-sm">
                          {t('pipeline.noApplications')}
                        </div>
                      ) : (
                        stageApps.map(app => (
                          <div
                            key={app.id}
                            onClick={() => setSelectedApplication(app)}
                            className={`bg-white rounded-lg p-3 border cursor-pointer transition-all hover:shadow-md ${
                              selectedApplication?.id === app.id
                                ? 'border-purple-400 ring-2 ring-purple-200'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-medium text-sm shrink-0">
                                {app.firstName.charAt(0)}
                                {app.lastName.charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 text-sm truncate">
                                  {app.firstName} {app.lastName}
                                </div>
                                <div className="text-xs text-gray-500 truncate">{app.email}</div>
                              </div>
                            </div>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-1 mt-2">
                              {app.source && (
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                  {app.source}
                                </span>
                              )}
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">
                                {new Date(app.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Candidate Detail Panel */}
        {selectedApplication && (
          <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
            {/* Panel Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">
                {selectedApplication.firstName} {selectedApplication.lastName}
              </h3>
              <button
                onClick={() => setSelectedApplication(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <XMarkIcon className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* Avatar and name */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-medium text-lg">
                  {selectedApplication.firstName.charAt(0)}
                  {selectedApplication.lastName.charAt(0)}
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {selectedApplication.firstName} {selectedApplication.lastName}
                  </div>
                  <div className="text-sm text-gray-500">{selectedJob?.title}</div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <EnvelopeIcon className="w-4 h-4 text-gray-400" />
                  <a href={`mailto:${selectedApplication.email}`} className="text-purple-600 hover:underline">
                    {selectedApplication.email}
                  </a>
                </div>
                {selectedApplication.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <PhoneIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">{selectedApplication.phone}</span>
                  </div>
                )}
              </div>

              {/* Current Status */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('pipeline.currentStatus')}
                </label>
                <div
                  className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium ${
                    STAGE_CONFIG.find(s => s.key === selectedApplication.status)?.bgClass
                  } ${STAGE_CONFIG.find(s => s.key === selectedApplication.status)?.colorClass}`}
                >
                  {t(`pipeline.stages.${selectedApplication.status}`)}
                </div>
              </div>

              {/* Move Stage Actions */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('pipeline.moveToStage')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {getNextStages(selectedApplication.status).map(nextStage => {
                    const config = STAGE_CONFIG.find(s => s.key === nextStage)!;
                    const isReject = nextStage === 'REJECTED';

                    return (
                      <button
                        key={nextStage}
                        onClick={() => updateApplicationStatus(selectedApplication.id, nextStage)}
                        disabled={updatingStatus}
                        className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50 ${
                          isReject
                            ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                            : `${config.bgClass} ${config.colorClass} ${config.borderClass} hover:opacity-80`
                        }`}
                      >
                        {t(`pipeline.stages.${nextStage}`)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              {selectedApplication.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('pipeline.notes')}
                  </label>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                    {selectedApplication.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Panel Footer */}
            <div className="border-t border-gray-200 p-4">
              <button
                onClick={() => updateApplicationStatus(selectedApplication.id, getNextStages(selectedApplication.status)[0])}
                disabled={updatingStatus || getNextStages(selectedApplication.status).length === 0}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {updatingStatus ? t('pipeline.updating') : t('pipeline.moveStage')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
