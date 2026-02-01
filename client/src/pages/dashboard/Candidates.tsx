import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { UserGroupIcon, MagnifyingGlassIcon, FunnelIcon, EllipsisVerticalIcon, ArrowsUpDownIcon, EyeIcon, XMarkIcon, ArrowDownTrayIcon, SparklesIcon, DocumentTextIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/pages/auth/AuthContext';
import { apiRequest } from '@/api/api';
import { getJobs } from '@/api/job';
import { downloadResume } from '@/api/application';
import { apiConfig } from '@/config/apiConfig';

interface ResumeAnalysisResult {
  score: number;
  conclusion: 'STRONG_HIRE' | 'HIRE' | 'LEAN_HIRE' | 'LEAN_NO' | 'NO';
  topStrengths: Array<{ point: string; evidence: string }>;
  topGaps: Array<{ gap: string; severity: 'high' | 'medium' | 'low' }>;
  risks: string[];
  hardRequirements: Array<{ requirement: string; status: 'pass' | 'warning' | 'fail'; evidence: string }>;
  skillsMatrix: Array<{ skill: string; candidateEvidence: string; match: number }>;
  interviewQuestions: Array<{ question: string; purpose: string; goodAnswer: string }>;
}

interface Candidate {
  id: number;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    applications: number;
  };
  applications?: Array<{
    id: number;
    createdAt: string;
    resumeId?: number | null;
    score?: number | null;
    feedback?: string | null;
    scoredAt?: string | null;
    resume?: {
      id: number;
      originalName: string;
      fileName: string;
      extractedText?: string | null;
    } | null;
    job?: {
      id: number;
      title: string;
      status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
      description?: string;
      requirements?: string;
    } | null;
  }>;
}

interface Job {
  id: number;
  title: string;
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
  location?: string;
}

type OpenMenuState =
  | null
  | {
      candidateId: number;
      top: number;
      left: number;
    };

export default function Candidates() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [updateTimeFilter, setUpdateTimeFilter] = useState<'ALL' | '1DAY' | '7DAYS' | '1MONTH'>('ALL');
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'name'>('updated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [openMenu, setOpenMenu] = useState<OpenMenuState>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [publishedJobs, setPublishedJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | ''>('');
  const [candidateForm, setCandidateForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  
  // Resume preview state
  const [previewResume, setPreviewResume] = useState<{
    resumeId: number;
    fileName: string;
    candidateName: string;
    blobUrl?: string;
    loading?: boolean;
    error?: string;
  } | null>(null);

  // Batch selection state
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<Set<number>>(new Set());

  // Rating states
  const [ratingCandidate, setRatingCandidate] = useState<Candidate | null>(null);
  const [isRating, setIsRating] = useState(false);

  // Batch rating modal
  const [showBatchRatingModal, setShowBatchRatingModal] = useState(false);
  const [batchRatingStatus, setBatchRatingStatus] = useState<Map<number, 'pending' | 'rating' | 'success' | 'error'>>(new Map());
  const [isBatchRating, setIsBatchRating] = useState(false);

  // Feedback preview panel
  const [previewFeedback, setPreviewFeedback] = useState<{
    candidateName: string;
    applicationId: number;
    score: number;
    feedback: ResumeAnalysisResult | null;
    scoredAt: string | null;
    loading?: boolean;
    error?: string;
  } | null>(null);

  // Load resume for preview
  async function loadResumePreview(resumeId: number, fileName: string, candidateName: string) {
    // Set initial loading state
    setPreviewResume({
      resumeId,
      fileName,
      candidateName,
      loading: true,
    });

    try {
      const token = localStorage.getItem('token') || '';
      const response = await fetch(`${apiConfig.baseUrl}/resumes/${resumeId}/preview`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load resume: ${response.status}`);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      setPreviewResume({
        resumeId,
        fileName,
        candidateName,
        blobUrl,
        loading: false,
      });
    } catch (err: any) {
      console.error('Failed to load resume preview:', err);
      setPreviewResume({
        resumeId,
        fileName,
        candidateName,
        loading: false,
        error: err.message || 'Failed to load resume',
      });
    }
  }

  // Cleanup blob URL when closing preview
  function closePreview() {
    if (previewResume?.blobUrl) {
      URL.revokeObjectURL(previewResume.blobUrl);
    }
    setPreviewResume(null);
  }

  // Toggle candidate selection
  function toggleCandidateSelection(candidateId: number) {
    setSelectedCandidateIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(candidateId)) {
        newSet.delete(candidateId);
      } else {
        newSet.add(candidateId);
      }
      return newSet;
    });
  }

  // Toggle all candidates selection
  function toggleAllSelection() {
    if (selectedCandidateIds.size === filteredAndSortedCandidates.length) {
      setSelectedCandidateIds(new Set());
    } else {
      setSelectedCandidateIds(new Set(filteredAndSortedCandidates.map(c => c.id)));
    }
  }

  // Rate single candidate
  async function handleRateCandidate(candidate: Candidate) {
    const application = candidate.applications?.[0];
    if (!application) {
      alert(t('candidates.errors.noApplication'));
      return;
    }

    setRatingCandidate(candidate);
    setIsRating(true);

    try {
      const response = await apiRequest(`/applications/${application.id}/rate`, 'POST');
      const result = (response as any)?.data;
      
      // Update local state
      setCandidates(prev => prev.map(c => {
        if (c.id === candidate.id && c.applications?.[0]) {
          return {
            ...c,
            applications: [{
              ...c.applications[0],
              score: result.score,
              feedback: JSON.stringify(result.feedback),
              scoredAt: result.scoredAt,
            }]
          };
        }
        return c;
      }));

      setRatingCandidate(null);
    } catch (err: any) {
      console.error('Failed to rate candidate:', err);
      alert(err.message || t('candidates.errors.rateFailed'));
      setRatingCandidate(null);
    } finally {
      setIsRating(false);
    }
  }

  // Open batch rating modal
  function openBatchRatingModal() {
    if (selectedCandidateIds.size === 0) {
      alert(t('candidates.errors.noSelection'));
      return;
    }
    
    // Initialize status map
    const statusMap = new Map<number, 'pending' | 'rating' | 'success' | 'error'>();
    selectedCandidateIds.forEach(id => statusMap.set(id, 'pending'));
    setBatchRatingStatus(statusMap);
    setShowBatchRatingModal(true);
  }

  // Start batch rating
  async function startBatchRating() {
    setIsBatchRating(true);

    // Get application IDs for selected candidates
    const applicationIds: number[] = [];
    const candidateToAppMap = new Map<number, number>();
    
    candidates.forEach(c => {
      if (selectedCandidateIds.has(c.id) && c.applications?.[0]?.id) {
        applicationIds.push(c.applications[0].id);
        candidateToAppMap.set(c.id, c.applications[0].id);
      }
    });

    // Rate one by one to show progress
    for (const candidateId of selectedCandidateIds) {
      const applicationId = candidateToAppMap.get(candidateId);
      if (!applicationId) {
        setBatchRatingStatus(prev => new Map(prev).set(candidateId, 'error'));
        continue;
      }

      setBatchRatingStatus(prev => new Map(prev).set(candidateId, 'rating'));

      try {
        const response = await apiRequest(`/applications/${applicationId}/rate`, 'POST');
        const result = (response as any)?.data;

        // Update local candidate data
        setCandidates(prev => prev.map(c => {
          if (c.id === candidateId && c.applications?.[0]) {
            return {
              ...c,
              applications: [{
                ...c.applications[0],
                score: result.score,
                feedback: JSON.stringify(result.feedback),
                scoredAt: result.scoredAt,
              }]
            };
          }
          return c;
        }));

        setBatchRatingStatus(prev => new Map(prev).set(candidateId, 'success'));
      } catch (err) {
        console.error(`Failed to rate candidate ${candidateId}:`, err);
        setBatchRatingStatus(prev => new Map(prev).set(candidateId, 'error'));
      }
    }

    setIsBatchRating(false);
  }

  // Close batch rating modal
  function closeBatchRatingModal() {
    if (isBatchRating) return;
    setShowBatchRatingModal(false);
    setSelectedCandidateIds(new Set());
    setBatchRatingStatus(new Map());
  }

  // Load feedback for preview
  async function loadFeedbackPreview(candidate: Candidate) {
    const application = candidate.applications?.[0];
    if (!application || !application.score) {
      return;
    }

    const candidateName = `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim() || candidate.email;

    setPreviewFeedback({
      candidateName,
      applicationId: application.id,
      score: application.score,
      feedback: null,
      scoredAt: application.scoredAt || null,
      loading: true,
    });

    try {
      const response = await apiRequest(`/applications/${application.id}/feedback`);
      const data = (response as any)?.data;

      setPreviewFeedback({
        candidateName,
        applicationId: application.id,
        score: data.score,
        feedback: data.feedback,
        scoredAt: data.scoredAt,
        loading: false,
      });
    } catch (err: any) {
      console.error('Failed to load feedback:', err);
      setPreviewFeedback(prev => prev ? {
        ...prev,
        loading: false,
        error: err.message || 'Failed to load feedback',
      } : null);
    }
  }

  // Close feedback preview
  function closeFeedbackPreview() {
    setPreviewFeedback(null);
  }

  // Get score color
  function getScoreColor(score: number): string {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-blue-600 bg-blue-50';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  }

  // Get conclusion text and color
  function getConclusionInfo(conclusion: string): { text: string; color: string } {
    const map: Record<string, { text: string; color: string }> = {
      'STRONG_HIRE': { text: t('candidates.conclusion.strongHire'), color: 'text-green-700 bg-green-100' },
      'HIRE': { text: t('candidates.conclusion.hire'), color: 'text-green-600 bg-green-50' },
      'LEAN_HIRE': { text: t('candidates.conclusion.leanHire'), color: 'text-blue-600 bg-blue-50' },
      'LEAN_NO': { text: t('candidates.conclusion.leanNo'), color: 'text-yellow-600 bg-yellow-50' },
      'NO': { text: t('candidates.conclusion.no'), color: 'text-red-600 bg-red-50' },
    };
    return map[conclusion] || { text: conclusion, color: 'text-gray-600 bg-gray-50' };
  }

  useEffect(() => {
    loadCandidates();
    loadPublishedJobs();
  }, []);

  async function loadCandidates() {
    setLoading(true);
    try {
      const response = await apiRequest('/candidates');
      const data = (response as any)?.data || [];
      setCandidates(data);
    } catch (err) {
      console.error('Failed to load candidates:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadPublishedJobs() {
    try {
      const jobs = await getJobs();
      const publishedOnly = (jobs as Job[]).filter((j) => j.status === 'PUBLISHED');
      setPublishedJobs(publishedOnly);
    } catch (err) {
      console.error('Failed to load jobs:', err);
      setPublishedJobs([]);
    }
  }

  const filteredAndSortedCandidates = useMemo(() => {
    let filtered = candidates.filter(candidate => {
      const matchesSearch = !searchQuery || 
        `${candidate.firstName} ${candidate.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        candidate.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        candidate.phone?.includes(searchQuery);
      
      let matchesTime = true;
      if (updateTimeFilter !== 'ALL') {
        const updatedDate = new Date(candidate.updatedAt);
        const now = new Date();
        const diffMs = now.getTime() - updatedDate.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        
        if (updateTimeFilter === '1DAY') matchesTime = diffDays <= 1;
        else if (updateTimeFilter === '7DAYS') matchesTime = diffDays <= 7;
        else if (updateTimeFilter === '1MONTH') matchesTime = diffDays <= 30;
      }
      
      return matchesSearch && matchesTime;
    });

    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'updated') {
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      } else if (sortBy === 'created') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === 'name') {
        const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
        const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
        comparison = nameA.localeCompare(nameB);
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [candidates, searchQuery, updateTimeFilter, sortBy, sortOrder]);

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

  function exportToCSV() {
    const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Applications', 'Created', 'Updated'];
    const rows = filteredAndSortedCandidates.map(c => [
      c.firstName || '',
      c.lastName || '',
      c.email,
      c.phone || '',
      c._count?.applications || 0,
      c.createdAt,
      c.updatedAt
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `candidates_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }

  function openCandidateModal(candidate?: Candidate) {
    if (candidate) {
      setEditingCandidate(candidate);
      setCandidateForm({
        firstName: candidate.firstName || '',
        lastName: candidate.lastName || '',
        email: candidate.email,
        phone: candidate.phone || ''
      });
    } else {
      setEditingCandidate(null);
      setCandidateForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: ''
      });
    }
    setSelectedJobId('');
    setShowCandidateModal(true);
  }

  async function handleSaveCandidate() {
    if (!candidateForm.email) {
      alert(t('candidates.validation.emailRequired'));
      return;
    }

    try {
      const candidateData = { ...candidateForm, userId: user?.id };

      if (editingCandidate) {
        await apiRequest(`/candidates/${editingCandidate.id}`, 'PATCH', candidateData as any);
      } else {
        if (!selectedJobId) {
          alert(t('candidates.validation.jobRequired'));
          return;
        }

        const createdCandidateResponse = await apiRequest('/candidates', 'POST', candidateData as any);
        const createdCandidate = (createdCandidateResponse as any)?.data;
        if (!createdCandidate?.id) {
          throw new Error('Invalid candidate response');
        }

        // Create application against a published job (manual add)
        await apiRequest(`/jobs/${selectedJobId}/apply`, 'POST', {
          candidateId: createdCandidate.id,
          firstName: candidateForm.firstName,
          lastName: candidateForm.lastName,
          email: candidateForm.email,
          phone: candidateForm.phone,
          source: 'manual',
        } as any);
      }

      setShowCandidateModal(false);
      setEditingCandidate(null);
      loadCandidates();
    } catch (err) {
      console.error('Failed to save candidate:', err);
      alert(t('candidates.errors.saveFailed'));
    }
  }

  async function handleDeleteCandidate(candidateId: number) {
    if (!window.confirm(t('candidates.confirm.deleteCandidate'))) return;
    
    try {
      await apiRequest(`/candidates/${candidateId}`, 'DELETE');
      loadCandidates();
      setOpenMenu(null);
    } catch (err) {
      console.error('Failed to delete candidate:', err);
      alert(t('candidates.errors.deleteFailed'));
    }
  }

  const openMenuCandidate = useMemo(() => {
    if (!openMenu) return null;
    return candidates.find((c) => c.id === openMenu.candidateId) || null;
  }, [openMenu, candidates]);

  function openCandidateMenu(candidateId: number, anchorEl: HTMLElement) {
    if (openMenu?.candidateId === candidateId) {
      setOpenMenu(null);
      return;
    }
    const rect = anchorEl.getBoundingClientRect();
    const menuWidth = 224; // w-56
    const viewportPadding = 12;
    const preferredLeft = rect.right - menuWidth;
    const clampedLeft = Math.min(
      Math.max(preferredLeft, viewportPadding),
      window.innerWidth - menuWidth - viewportPadding
    );

    setOpenMenu({
      candidateId,
      top: rect.bottom + 8,
      left: clampedLeft,
    });
  }

  useEffect(() => {
    function handleGlobalClose() {
      setOpenMenu(null);
    }

    function handleResizeOrScroll() {
      // Prevent stale position; close rather than chasing scroll offsets
      setOpenMenu(null);
    }

    if (openMenu) {
      window.addEventListener('resize', handleResizeOrScroll, true);
      window.addEventListener('scroll', handleResizeOrScroll, true);
      window.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Escape') handleGlobalClose();
      });
    }

    return () => {
      window.removeEventListener('resize', handleResizeOrScroll, true);
      window.removeEventListener('scroll', handleResizeOrScroll, true);
    };
  }, [openMenu]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <UserGroupIcon className="w-8 h-8 text-indigo-600" />
              <h1 className="text-3xl font-bold text-gray-900">{t('navigation.candidates')}</h1>
            </div>
            <p className="text-gray-600">{t('candidates.subtitle')}</p>
          </div>
          <button 
            onClick={() => openCandidateModal()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            {t('candidates.newCandidate')}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">{t('candidates.stats.total')}</span>
              <UserGroupIcon className="w-5 h-5 text-gray-400" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{candidates.length}</div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">{t('candidates.stats.active')}</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{candidates.length}</div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">{t('candidates.stats.thisWeek')}</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {candidates.filter(c => {
                const diffMs = new Date().getTime() - new Date(c.createdAt).getTime();
                return diffMs < 7 * 24 * 60 * 60 * 1000;
              }).length}
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">{t('candidates.stats.applications')}</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {candidates.reduce((sum, c) => sum + (c._count?.applications || 0), 0)}
            </div>
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
              placeholder={t('candidates.searchPlaceholder')}
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
                    {t('candidates.sortOptions.updatedNewest')}
                  </button>
                  <button
                    onClick={() => { setSortBy('updated'); setSortOrder('asc'); setShowSort(false); }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {t('candidates.sortOptions.updatedOldest')}
                  </button>
                  <button
                    onClick={() => { setSortBy('name'); setSortOrder('asc'); setShowSort(false); }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {t('candidates.sortOptions.nameAZ')}
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

          {(
            <button
              onClick={openBatchRatingModal}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <SparklesIcon className="w-4 h-4" />
              {t('candidates.batchRate')} ({selectedCandidateIds.size})
            </button>
          )}
        </div>

        {/* Candidates Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-visible">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    checked={selectedCandidateIds.size === filteredAndSortedCandidates.length && filteredAndSortedCandidates.length > 0}
                    onChange={toggleAllSelection}
                  />
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">{t('candidates.table.name')}</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">{t('candidates.table.email')}</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">{t('candidates.table.phone')}</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">{t('candidates.table.applications')}</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">{t('candidates.table.score')}</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">{t('candidates.table.added')}</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">{t('candidates.table.appliedJob')}</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    {t('forms.loading')}
                  </td>
                </tr>
              ) : filteredAndSortedCandidates.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    {t('candidates.empty')}
                  </td>
                </tr>
              ) : (
                filteredAndSortedCandidates.map((candidate) => {
                  const application = candidate.applications?.[0];
                  const score = application?.score;
                  const hasScore = score !== null && score !== undefined;

                  return (
                    <tr key={candidate.id} className={`hover:bg-gray-50 ${selectedCandidateIds.has(candidate.id) ? 'bg-indigo-50' : ''}`}>
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300"
                          checked={selectedCandidateIds.has(candidate.id)}
                          onChange={() => toggleCandidateSelection(candidate.id)}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">
                          {candidate.firstName} {candidate.lastName}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {candidate.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {candidate.phone || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">
                          {candidate._count?.applications || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {hasScore ? (
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-md text-sm font-medium ${getScoreColor(score)}`}>
                              {score.toFixed(1)}
                            </span>
                            <button
                              onClick={() => loadFeedbackPreview(candidate)}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                              title={t('candidates.viewFeedback')}
                            >
                              <DocumentTextIcon className="w-4 h-4 text-gray-500" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(candidate.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {application?.job?.title || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative flex items-center gap-1">
                          {/* View Resume Button */}
                          {application?.resumeId ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const resumeId = application?.resumeId;
                                const resume = application?.resume;
                                if (resumeId) {
                                  loadResumePreview(
                                    resumeId,
                                    resume?.originalName || `Resume-${resumeId}`,
                                    `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim() || candidate.email
                                  );
                                }
                              }}
                              className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                              title={t('candidates.viewResume')}
                            >
                              <EyeIcon className="w-5 h-5 text-blue-600" />
                            </button>
                          ) : (
                            <button
                              disabled
                              className="p-2 rounded-lg opacity-30 cursor-not-allowed"
                              title={t('candidates.noResume')}
                            >
                              <EyeIcon className="w-5 h-5 text-gray-400" />
                            </button>
                          )}
                          <button
                            onClick={(e) => openCandidateMenu(candidate.id, e.currentTarget)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <EllipsisVerticalIcon className="w-5 h-5 text-gray-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          
          {/* Footer */}
          <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between text-sm text-gray-600">
            <div>{t('candidates.showing', { count: filteredAndSortedCandidates.length })}</div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 rounded hover:bg-gray-100">{t('pagination.previous')}</button>
              <button className="px-3 py-1 bg-indigo-600 text-white rounded">1</button>
              <button className="px-3 py-1 rounded hover:bg-gray-100">{t('pagination.next')}</button>
            </div>
          </div>
        </div>

        {/* Candidate Modal */}
        {showCandidateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingCandidate ? t('candidates.modal.editTitle') : t('candidates.newCandidate')}
                </h2>
              </div>
              
              <div className="p-6 space-y-4">
                {!editingCandidate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('candidates.form.job')} *
                    </label>
                    <select
                      value={selectedJobId}
                      onChange={(e) => setSelectedJobId(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">{t('candidates.form.jobPlaceholder')}</option>
                      {publishedJobs.map((job) => (
                        <option key={job.id} value={job.id}>
                          {job.title}{job.location ? ` • ${job.location}` : ''}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">{t('candidates.form.jobHint')}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('pipeline.firstName')}</label>
                    <input
                      type="text"
                      value={candidateForm.firstName}
                      onChange={(e) => setCandidateForm({ ...candidateForm, firstName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder={t('pipeline.firstNamePlaceholder')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('pipeline.lastName')}</label>
                    <input
                      type="text"
                      value={candidateForm.lastName}
                      onChange={(e) => setCandidateForm({ ...candidateForm, lastName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder={t('pipeline.lastNamePlaceholder')}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('pipeline.email')} *</label>
                  <input
                    type="email"
                    value={candidateForm.email}
                    onChange={(e) => setCandidateForm({ ...candidateForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder={t('pipeline.emailPlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('pipeline.phone')}</label>
                  <input
                    type="tel"
                    value={candidateForm.phone}
                    onChange={(e) => setCandidateForm({ ...candidateForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder={t('pipeline.phonePlaceholder')}
                  />
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  onClick={() => { setShowCandidateModal(false); setEditingCandidate(null); }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {t('forms.cancel')}
                </button>
                <button
                  onClick={handleSaveCandidate}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  {editingCandidate ? t('forms.save') : t('forms.add')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <CandidateMenuPortal
        openMenu={openMenu}
        candidate={openMenuCandidate}
        onClose={() => setOpenMenu(null)}
        onEdit={() => {
          if (!openMenuCandidate) return;
          openCandidateModal(openMenuCandidate);
          setOpenMenu(null);
        }}
        onDelete={() => {
          if (!openMenuCandidate) return;
          handleDeleteCandidate(openMenuCandidate.id);
        }}
        onRate={() => {
          if (!openMenuCandidate) return;
          handleRateCandidate(openMenuCandidate);
          setOpenMenu(null);
        }}
        isRating={isRating && ratingCandidate?.id === openMenuCandidate?.id}
        t={t}
      />

      {/* Resume Preview Panel */}
      {previewResume && (
        <>
          {/* Backdrop with blur */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={closePreview}
          />
          
          {/* Preview Panel - Right Side */}
          <div className="fixed top-0 right-0 h-full w-[50vw] max-w-3xl bg-white shadow-2xl z-50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{previewResume.candidateName}</h3>
                <p className="text-sm text-gray-500">{previewResume.fileName}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    downloadResume(previewResume.resumeId).catch((err) => {
                      console.error('Failed to download resume:', err);
                      alert(t('candidates.errors.resumeDownloadFailed'));
                    });
                  }}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  title={t('candidates.downloadResume')}
                >
                  <ArrowDownTrayIcon className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={closePreview}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
            
            {/* PDF Viewer */}
            <div className="flex-1 overflow-hidden">
              {previewResume.loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-gray-500">{t('forms.loading')}</div>
                </div>
              ) : previewResume.error ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-red-500">{previewResume.error}</div>
                </div>
              ) : previewResume.blobUrl ? (
                <iframe
                  src={previewResume.blobUrl}
                  className="w-full h-full border-0"
                  title="Resume Preview"
                />
              ) : null}
            </div>
          </div>
        </>
      )}

      {/* Batch Rating Modal */}
      {showBatchRatingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {t('candidates.batchRateTitle')}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {t('candidates.batchRateDesc', { count: selectedCandidateIds.size })}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
                {Array.from(selectedCandidateIds).map(candidateId => {
                  const candidate = candidates.find(c => c.id === candidateId);
                  if (!candidate) return null;

                  const status = batchRatingStatus.get(candidateId) || 'pending';
                  const candidateName = `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim() || candidate.email;

                  return (
                    <div
                      key={candidateId}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-indigo-600 font-medium">
                            {(candidate.firstName?.[0] || candidate.email[0]).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{candidateName}</div>
                          <div className="text-sm text-gray-500">{candidate.email}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {status === 'pending' && (
                          <span className="text-sm text-gray-500">{t('candidates.batchStatus.pending')}</span>
                        )}
                        {status === 'rating' && (
                          <span className="flex items-center gap-2 text-sm text-purple-600">
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            {t('candidates.batchStatus.rating')}
                          </span>
                        )}
                        {status === 'success' && (
                          <span className="flex items-center gap-1 text-sm text-green-600">
                            <CheckCircleIcon className="w-5 h-5" />
                            {t('candidates.batchStatus.success')}
                          </span>
                        )}
                        {status === 'error' && (
                          <span className="flex items-center gap-1 text-sm text-red-600">
                            <ExclamationCircleIcon className="w-5 h-5" />
                            {t('candidates.batchStatus.error')}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={closeBatchRatingModal}
                disabled={isBatchRating}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                {isBatchRating ? t('forms.cancel') : t('forms.close')}
              </button>
              {!isBatchRating && Array.from(batchRatingStatus.values()).every(s => s === 'pending') && (
                <button
                  onClick={startBatchRating}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                >
                  <SparklesIcon className="w-4 h-4" />
                  {t('candidates.startBatchRate')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Feedback Preview Panel */}
      {previewFeedback && (
        <>
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={closeFeedbackPreview}
          />
          
          <div className="fixed top-0 right-0 h-full w-[50vw] max-w-3xl bg-white shadow-2xl z-50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{previewFeedback.candidateName}</h3>
                <p className="text-sm text-gray-500">
                  {t('candidates.feedbackTitle')} • {previewFeedback.scoredAt ? new Date(previewFeedback.scoredAt).toLocaleString() : ''}
                </p>
              </div>
              <button
                onClick={closeFeedbackPreview}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {previewFeedback.loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-gray-500">{t('forms.loading')}</div>
                </div>
              ) : previewFeedback.error ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-red-500">{previewFeedback.error}</div>
                </div>
              ) : previewFeedback.feedback ? (
                <div className="space-y-6">
                  {/* Score & Conclusion */}
                  <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <div className={`text-4xl font-bold ${getScoreColor(previewFeedback.score)}`}>
                        {previewFeedback.score.toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-500">{t('candidates.overallScore')}</div>
                    </div>
                    <div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getConclusionInfo(previewFeedback.feedback.conclusion).color}`}>
                        {getConclusionInfo(previewFeedback.feedback.conclusion).text}
                      </span>
                    </div>
                  </div>

                  {/* Top Strengths */}
                  {previewFeedback.feedback.topStrengths?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">{t('candidates.feedback.strengths')}</h4>
                      <div className="space-y-2">
                        {previewFeedback.feedback.topStrengths.map((item, idx) => (
                          <div key={idx} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="font-medium text-green-800">{item.point}</div>
                            <div className="text-sm text-green-700 mt-1">{item.evidence}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Top Gaps */}
                  {previewFeedback.feedback.topGaps?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">{t('candidates.feedback.gaps')}</h4>
                      <div className="space-y-2">
                        {previewFeedback.feedback.topGaps.map((item, idx) => (
                          <div key={idx} className={`p-3 rounded-lg border ${
                            item.severity === 'high' ? 'bg-red-50 border-red-200' :
                            item.severity === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                            'bg-gray-50 border-gray-200'
                          }`}>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                item.severity === 'high' ? 'bg-red-200 text-red-800' :
                                item.severity === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                                'bg-gray-200 text-gray-800'
                              }`}>
                                {item.severity}
                              </span>
                              <span className="font-medium">{item.gap}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Risks */}
                  {previewFeedback.feedback.risks?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">{t('candidates.feedback.risks')}</h4>
                      <ul className="list-disc list-inside space-y-1 text-gray-700">
                        {previewFeedback.feedback.risks.map((risk, idx) => (
                          <li key={idx}>{risk}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Skills Matrix */}
                  {previewFeedback.feedback.skillsMatrix?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">{t('candidates.feedback.skills')}</h4>
                      <div className="space-y-2">
                        {previewFeedback.feedback.skillsMatrix.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                            <div className="w-24 font-medium text-gray-900">{item.skill}</div>
                            <div className="flex-1">
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    item.match >= 80 ? 'bg-green-500' :
                                    item.match >= 60 ? 'bg-blue-500' :
                                    item.match >= 40 ? 'bg-yellow-500' :
                                    'bg-red-500'
                                  }`}
                                  style={{ width: `${item.match}%` }}
                                />
                              </div>
                            </div>
                            <div className="w-12 text-right text-sm font-medium">{item.match}%</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Interview Questions */}
                  {previewFeedback.feedback.interviewQuestions?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">{t('candidates.feedback.interviewQuestions')}</h4>
                      <div className="space-y-3">
                        {previewFeedback.feedback.interviewQuestions.map((item, idx) => (
                          <div key={idx} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="font-medium text-blue-900">{idx + 1}. {item.question}</div>
                            <div className="text-sm text-blue-700 mt-2">
                              <span className="font-medium">{t('candidates.feedback.purpose')}:</span> {item.purpose}
                            </div>
                            <div className="text-sm text-blue-700 mt-1">
                              <span className="font-medium">{t('candidates.feedback.goodAnswer')}:</span> {item.goodAnswer}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function CandidateMenuPortal({
  openMenu,
  candidate,
  onClose,
  onEdit,
  onDelete,
  onRate,
  isRating,
  t,
}: {
  openMenu: OpenMenuState;
  candidate: Candidate | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onRate: () => void;
  isRating: boolean;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  if (!openMenu) return null;

  const hasResume = candidate?.applications?.[0]?.resume?.extractedText;

  const menu = (
    <>
      <div className="fixed inset-0 z-9998" onClick={onClose} />
      <div
        className="fixed z-9999 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-1"
        style={{ top: openMenu.top, left: openMenu.left }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onEdit}
          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
        >
          <span>✏️</span>
          {t('forms.edit')}
        </button>
        <button
          onClick={onDelete}
          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
        >
          <span>🗑️</span>
          {t('forms.delete')}
        </button>
        <div className="border-t border-gray-100 my-1" />
        <button
          onClick={onRate}
          disabled={isRating || !hasResume}
          className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
            hasResume
              ? 'text-purple-600 hover:bg-purple-50'
              : 'text-gray-400 cursor-not-allowed'
          }`}
          title={!hasResume ? t('candidates.errors.noResumeText') : undefined}
        >
          <SparklesIcon className="w-4 h-4" />
          {isRating ? t('candidates.rating') : t('candidates.rate')}
        </button>
      </div>
    </>
  );

  return createPortal(menu, document.body);
}
