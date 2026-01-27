import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { UserGroupIcon, MagnifyingGlassIcon, FunnelIcon, EllipsisVerticalIcon, ArrowsUpDownIcon } from '@heroicons/react/24/outline';
import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/pages/auth/AuthContext';
import { apiRequest } from '@/api/api';
import { getJobs } from '@/api/job';

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
    job?: {
      id: number;
      title: string;
      status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
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
        </div>

        {/* Candidates Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-visible">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input type="checkbox" className="rounded border-gray-300" />
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">{t('candidates.table.name')}</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">{t('candidates.table.email')}</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">{t('candidates.table.phone')}</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">{t('candidates.table.applications')}</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">{t('candidates.table.added')}</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">{t('candidates.table.appliedJob')}</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    {t('forms.loading')}
                  </td>
                </tr>
              ) : filteredAndSortedCandidates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    {t('candidates.empty')}
                  </td>
                </tr>
              ) : (
                filteredAndSortedCandidates.map((candidate) => (
                  <tr key={candidate.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input type="checkbox" className="rounded border-gray-300" />
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
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(candidate.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {candidate.applications?.[0]?.job?.title || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative">
                        <button
                          onClick={(e) => openCandidateMenu(candidate.id, e.currentTarget)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <EllipsisVerticalIcon className="w-5 h-5 text-gray-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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
        t={t}
      />
    </div>
  );
}

function CandidateMenuPortal({
  openMenu,
  onClose,
  onEdit,
  onDelete,
  t,
}: {
  openMenu: OpenMenuState;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  if (!openMenu) return null;

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
      </div>
    </>
  );

  return createPortal(menu, document.body);
}
