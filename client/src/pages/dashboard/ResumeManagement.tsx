import { useEffect, useMemo, useState } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  SparklesIcon,
  XMarkIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ArrowDownTrayIcon,
  ArrowsUpDownIcon,
  EnvelopeIcon,
  TagIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ScoreBadge } from '@/components/ui/ScoreBadge';
import { useFilteredCandidates, useSortedCandidates, type Candidate } from '@/hooks/useCandidates';
import { SimpleConnectionGuard } from '@/components/common/SimpleConnectionStatus';
import PageShell from '@/components/layout/PageShell';
import { getAllApplications, downloadResume } from '@/api/application';
import { TagList } from '@/components/tag/Taglist';
import Modal from '@/components/ui/Modal';
import { ListSearchBar } from '@/components/ui/ListSearchBar';

// Map backend status to user-friendly label
function formatStatus(s: string) {
  return s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase());
}

// Transform server application to Candidate view model
function toCandidate(app: any): Candidate {
  const name = `${app.firstName} ${app.lastName}`.trim();
  const role = app.job?.title || 'N/A';
  const tags: string[] = [];
  const experience = app.yearsExperience || 0;
  const location = app.job?.location || '—';
  const updatedAt = (app.updatedAt || app.createdAt || new Date().toISOString()).toString();
  const score = 0; // Placeholder until scoring implemented
  const rationale = app.coverLetter || '—';
  if (app.source) tags.push(String(app.source));
  if (app.status) tags.push(formatStatus(String(app.status)));
  if (experience) tags.push(`${experience} yrs`);
  return {
    id: String(app.id),
    name,
    email: app.email,
    phone: app.phone || '',
    role,
    source: app.source || 'website',
    experience,
    location,
    tags,
    updatedAt,
    score,
    rationale,
    status: formatStatus(app.status || 'SUBMITTED'),
  };
}



export default function ResumeManagement() {
  const [q, setQ] = useState('');
  const [role, setRole] = useState<string | null>(null);
  const [minScore, setMinScore] = useState<number | null>(null);
  const [detail, setDetail] = useState<Candidate | null>(null);
  const [sortBy, setSortBy] = useState<{ key: 'updatedAt' | 'score' | 'name'; dir: 'asc' | 'desc' }>({ key: 'updatedAt', dir: 'desc' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apps, setApps] = useState<any[]>([]);

  // Load applications (all jobs, paginated)
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await getAllApplications({ page: 1 });
        const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.applications) ? res.applications : []);
        if (mounted) setApps(data);
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Failed to load applications');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const candidates: Candidate[] = useMemo(() => apps.map(toCandidate), [apps]);

  const filtered = useFilteredCandidates(candidates, q, role, minScore);
  const sorted = useSortedCandidates(filtered, sortBy.key, sortBy.dir);

  // Compute simple pipeline buckets from application statuses
  const pipeline = useMemo(() => {
    const counts = {
      new: 0,
      screening: 0,
      interview: 0,
      offer: 0,
    } as Record<string, number>;
    for (const a of apps) {
      const s = String(a.status || 'SUBMITTED');
      if (s === 'SUBMITTED') counts.new++;
      else if (s === 'UNDER_REVIEW' || s === 'SHORTLISTED') counts.screening++;
      else if (s === 'INTERVIEW_SCHEDULED' || s === 'INTERVIEWED') counts.interview++;
      else if (s === 'OFFER_EXTENDED' || s === 'HIRED') counts.offer++;
    }
    return counts;
  }, [apps]);

  const roles = useMemo(
    () => Array.from(new Set(candidates.map((c) => c.role).filter(Boolean))).sort(),
    [candidates],
  );

  function toggleSort(key: 'updatedAt' | 'score' | 'name') {
    setSortBy((prev) => {
      if (prev.key !== key) return { key, dir: 'desc' };
      return { key, dir: prev.dir === 'desc' ? 'asc' : 'desc' };
    });
  }

  function scoreFilterLabel(value: number | null) {
    if (value == null) return 'All scores';
    return `${value}+ match`;
  }

  async function handleDownloadForCandidate(candidate: Candidate) {
    const app = apps.find((a) => String(a.id) === candidate.id);
    const resumeId = app?.resume?.id;
    if (!resumeId) {
      alert('No resume file available for this candidate.');
      return;
    }
    try {
      await downloadResume(resumeId);
    } catch (e: any) {
      alert(e?.message || 'Failed to download resume');
    }
  }

  return (
    <SimpleConnectionGuard>
      <PageShell
        icon={<DocumentTextIcon className="w-7 h-7 text-blue-600" />}
        title="Resume Management"
        subtitle="Search, filter, and download resumes across all jobs."
        right={(
          <div className="flex items-center gap-2">
            <Button
              type="button"
              className="flex items-center gap-2"
              onClick={() => {
                if (!sorted.length) {
                  alert('No resumes to export.');
                  return;
                }
                const csv = sorted
                  .map((c) => [
                    c.name,
                    c.email,
                    c.role,
                    c.status,
                    c.location,
                    c.experience,
                    c.updatedAt,
                  ].map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
                  .join('\n');
                const blob = new Blob([`name,email,role,status,location,experience,updatedAt\n${csv}`], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'resumes.csv';
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
              }}
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              <span className="text-sm">Export CSV</span>
            </Button>
          </div>
        )}
        className="px-4 pb-8"
      >
        <div className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-4">
            <Card className="w-full max-w-none p-6 lg:col-span-3">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <ListSearchBar
                    value={q}
                    onChange={setQ}
                    placeholder="Search by name, email, role…"
                    className="flex-1"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center gap-2 rounded-full bg-gray-50 px-3 py-1 text-xs text-gray-600">
                      <FunnelIcon className="h-4 w-4" />
                      <span>Filters</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setRole(null);
                        setMinScore(null);
                        setQ('');
                      }}
                      className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                    >
                      <XMarkIcon className="h-3.5 w-3.5" />
                      Clear
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-xs font-medium text-gray-600">
                      <TagIcon className="h-4 w-4" />
                      Role
                    </span>
                    <select
                      value={role ?? ''}
                      onChange={(e) => setRole(e.target.value || null)}
                      className="min-w-[140px] rounded-lg border border-gray-200 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">All roles</option>
                      {roles.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-xs font-medium text-gray-600">
                      <SparklesIcon className="h-4 w-4" />
                      Match
                    </span>
                    {[null, 70, 85].map((value) => (
                      <button
                        key={value ?? 'all'}
                        type="button"
                        onClick={() => setMinScore(value)}
                        className={`rounded-full border px-2.5 py-1 text-xs ${
                          minScore === value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {scoreFilterLabel(value)}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-xs font-medium text-gray-600">
                      <ArrowsUpDownIcon className="h-4 w-4" />
                      Sort
                    </span>
                    <div className="inline-flex rounded-full bg-gray-50 p-0.5 text-xs">
                      {(['updatedAt', 'score', 'name'] as const).map((key) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => toggleSort(key)}
                          className={`rounded-full px-3 py-1 ${
                            sortBy.key === key
                              ? 'bg-white text-gray-900 shadow-sm'
                              : 'text-gray-500'
                          }`}
                        >
                          {key === 'updatedAt' && 'Recent'}
                          {key === 'score' && 'Match'}
                          {key === 'name' && 'Name'}
                          {sortBy.key === key && (
                            <span className="ml-1 text-[10px] uppercase text-gray-400">
                              {sortBy.dir === 'desc' ? '↓' : '↑'}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="w-full max-w-none p-6 lg:col-span-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <UserGroupIcon className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="text-xs font-medium text-gray-600">Pipeline</div>
                    <div className="text-sm font-semibold text-gray-900">
                      {candidates.length} candidates
                    </div>
                  </div>
                </div>
                <ChartBarIcon className="h-6 w-6 text-gray-300" />
              </div>
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2">
                  <span className="text-gray-700">New</span>
                  <span className="font-semibold text-blue-700">{pipeline.new}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2">
                  <span className="text-gray-700">Screening</span>
                  <span className="font-semibold text-amber-700">{pipeline.screening}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-indigo-50 px-3 py-2">
                  <span className="text-gray-700">Interview</span>
                  <span className="font-semibold text-indigo-700">{pipeline.interview}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2">
                  <span className="text-gray-700">Offer</span>
                  <span className="font-semibold text-emerald-700">{pipeline.offer}</span>
                </div>
              </div>
            </Card>
          </div>

          <div className="mt-2 rounded-xl border border-gray-200 bg-white">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-sm text-gray-500">
                Loading resumes…
              </div>
            ) : sorted.length === 0 ? (
              <div className="grid place-items-center gap-3 py-12 text-center text-sm text-gray-500">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
                  <DocumentTextIcon className="h-8 w-8 text-blue-500" />
                </div>
                <div className="text-base font-semibold text-gray-800">No resumes found</div>
                <p className="max-w-md text-xs text-gray-500">
                  Once candidates start applying, their resumes will appear here. You can filter and
                  download them for further review.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {sorted.map((c) => (
                  <div
                    key={c.id}
                    className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between hover:bg-gray-50"
                  >
                    <div className="flex flex-1 items-start gap-3">
                      <div className="mt-0.5 hidden h-9 w-9 flex-none items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700 sm:flex">
                        {c.name
                          .split(' ')
                          .map((part) => part[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-sm font-semibold text-gray-900">{c.name}</div>
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700">
                            {c.status}
                          </span>
                          {c.score > 0 && <ScoreBadge score={c.score} />}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                          <span>{c.role}</span>
                          <span>•</span>
                          <span>{c.email}</span>
                          {c.location && (
                            <>
                              <span>•</span>
                              <span>{c.location}</span>
                            </>
                          )}
                          {c.experience ? (
                            <>
                              <span>•</span>
                              <span>{c.experience} yrs exp</span>
                            </>
                          ) : null}
                        </div>
                        {c.tags.length > 0 && (
                          <div className="mt-1">
                            <TagList tags={c.tags} />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-none flex-col items-start gap-2 text-xs sm:items-end">
                      <div className="text-[11px] text-gray-400">
                        Updated {new Date(c.updatedAt).toLocaleDateString()}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          className="flex items-center gap-1 bg-white px-3 py-1 text-xs text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
                          onClick={() => handleDownloadForCandidate(c)}
                        >
                          <ArrowDownTrayIcon className="h-4 w-4 text-blue-600" />
                          Resume
                        </Button>
                        <Button
                          type="button"
                          className="flex items-center gap-1 bg-white px-3 py-1 text-xs text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
                          onClick={() => setDetail(c)}
                        >
                          <MagnifyingGlassIcon className="h-4 w-4 text-gray-600" />
                          Details
                        </Button>
                        <Button
                          type="button"
                          className="flex items-center gap-1 bg-white px-3 py-1 text-xs text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
                          onClick={() => {
                            window.location.href = `mailto:${encodeURIComponent(
                              c.email,
                            )}?subject=${encodeURIComponent(
                              `Regarding your application for ${c.role}`,
                            )}`;
                          }}
                        >
                          <EnvelopeIcon className="h-4 w-4 text-gray-600" />
                          Email
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <Modal open={detail != null} title={detail?.name || 'Candidate details'} onClose={() => setDetail(null)}>
          {detail && (
            <div className="space-y-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-gray-900">{detail.name}</span>
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700">
                  {detail.status}
                </span>
                {detail.score > 0 && <ScoreBadge score={detail.score} />}
              </div>
              <div className="space-y-1 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <EnvelopeIcon className="h-4 w-4 text-gray-500" />
                  <span>{detail.email}</span>
                </div>
                {detail.phone && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] uppercase tracking-wide text-gray-500">Phone</span>
                    <span>{detail.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] uppercase tracking-wide text-gray-500">Role</span>
                  <span>{detail.role}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] uppercase tracking-wide text-gray-500">Location</span>
                  <span>{detail.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] uppercase tracking-wide text-gray-500">Updated</span>
                  <span>{new Date(detail.updatedAt).toLocaleString()}</span>
                </div>
              </div>
              {detail.tags.length > 0 && (
                <div>
                  <div className="mb-1 text-xs font-medium text-gray-600">Tags</div>
                  <TagList tags={detail.tags} />
                </div>
              )}
              {detail.rationale && detail.rationale !== '—' && (
                <div>
                  <div className="mb-1 text-xs font-medium text-gray-600">Cover Letter / Notes</div>
                  <p className="whitespace-pre-wrap rounded-md bg-gray-50 p-3 text-xs text-gray-700">
                    {detail.rationale}
                  </p>
                </div>
              )}
            </div>
          )}
        </Modal>
      </PageShell>
    </SimpleConnectionGuard>
  );
}
