import { useEffect, useMemo, useState } from 'react'; 
import { BriefcaseIcon } from '@heroicons/react/24/outline';
import { SimpleConnectionIndicator, SimpleConnectionGuard } from '@/components/common/SimpleConnectionStatus';
import PageShell from '@/components/layout/PageShell';
import JobForm from '@/components/form/JobForm';
import type { Job } from '@/types';
import { getJobs, createJob, updateJob, deleteJob, publishJob } from '@/api/job';
import Modal from '@/components/ui/Modal';
import { DetailPanel } from '@/components/layout/DetailPanel';
import { Button } from '@/components/ui/Button';
import { ListSearchBar } from '@/components/ui/ListSearchBar';
import { Card } from '@/components/ui/Card';
export default function Jobs() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'ALL' | 'PUBLISHED' | 'DRAFT' | 'ARCHIVED' | 'CLOSED'>('ALL');
  const [detailsJob, setDetailsJob] = useState<Job | null>(null);
  const [shareJob, setShareJob] = useState<Job | null>(null);
  const [copyMsg, setCopyMsg] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await getJobs();
      setJobs(data as Job[]);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(jobData: Job) {
    setFormError(null);
    try {
      if (editingJob?.id) {
        await updateJob(editingJob.id, jobData);
      } else {
        await createJob(jobData);
      }
      setShowForm(false);
      setEditingJob(null);
      await load(); // Reload the list
    } catch (err: any) {
      setFormError(err?.message ?? 'Failed to save job');
    }
  }

  async function handlePublish(job: Job) {
    try {
      if ((job.status as any) !== 'PUBLISHED' && job.id) {
        await publishJob(job.id);
        await load();
      }
      setShareJob(job);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to publish job');
    }
  }

  function getPublicLinks(jobId: number) {
    const origin = window.location.origin;
    return {
      details: `${origin}/jobs/${jobId}`,
      apply: `${origin}/jobs/${jobId}/apply`
    };
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyMsg('Link copied');
      setTimeout(() => setCopyMsg(null), 1500);
    } catch (_e) {
      setCopyMsg('Copy failed');
      setTimeout(() => setCopyMsg(null), 1500);
    }
  }

  async function handleDelete(jobId: number) {
    if (!window.confirm('Are you sure you want to delete this job?')) {
      return;
    }
    
    try {
      await deleteJob(jobId);
      await load(); // Reload the list
    } catch (err: any) {
      setError(err?.message ?? 'Failed to delete job');
    }
  }

  function handleEdit(job: Job) {
    setEditingJob(job);
    setShowForm(true);
  }

  function handleCancel() {
    setShowForm(false);
    setEditingJob(null);
    setFormError(null);
  }

  // status color helpers not used in current UI

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return jobs.filter(j => {
      const byText = !ql || `${j.title} ${j.description ?? ''} ${j.location ?? ''}`.toLowerCase().includes(ql);
      const byStatus = status === 'ALL' || (j.status as any) === status;
      return byText && byStatus;
    });
  }, [jobs, q, status]);

  return (
    <SimpleConnectionGuard>
      <PageShell
        icon={<BriefcaseIcon className="w-6 h-6 text-indigo-600" />}
        title="Jobs"
        subtitle="Create, publish, and manage your open roles."
        right={(
          <div className="flex items-center gap-3">
            <SimpleConnectionIndicator />
            <Button
              type="button"
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700"
            >
              New Job
            </Button>
          </div>
        )}
        className="px-4 pb-8"
      >
        <div className="space-y-4 pb-0">
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
                    placeholder="Search title, description, location…"
                    className="flex-1"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center gap-2 rounded-full bg-gray-50 px-3 py-1 text-xs text-gray-600">
                      <span>Filters</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setQ('');
                        setStatus('ALL');
                      }}
                      className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-600">Status</span>
                    <div className="flex flex-wrap gap-2">
                      {(['ALL', 'PUBLISHED', 'DRAFT', 'ARCHIVED', 'CLOSED'] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setStatus(s)}
                          className={`rounded-full border px-2 py-1 text-xs transition ${
                            status === s
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                              : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="w-full max-w-none p-6 lg:col-span-1">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-medium text-gray-600">Totals</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {jobs.length} jobs
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2">
                  <span className="text-gray-700">Published</span>
                  <span className="font-semibold text-emerald-700">
                    {jobs.filter((j) => (j.status as any) === 'PUBLISHED').length}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                  <span className="text-gray-700">Draft</span>
                  <span className="font-semibold text-gray-800">
                    {jobs.filter((j) => (j.status as any) === 'DRAFT').length}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          <div className="mt-2 rounded-xl border border-zinc-200 bg-white shadow-sm">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-sm text-zinc-500">
                Loading jobs…
              </div>
            ) : filtered.length === 0 ? (
              <div className="grid place-items-center gap-3 py-12 text-center text-sm text-zinc-500">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-2xl">
                  <BriefcaseIcon className="h-8 w-8 text-indigo-500" />
                </div>
                <div className="text-base font-semibold text-zinc-800">No jobs found</div>
                <p className="max-w-md text-xs text-zinc-500">
                  Create a new job to start collecting applications. Published jobs will appear here.
                </p>
              </div>
            ) : (
              <>
                <div className="px-4 py-3 border-b bg-white text-sm text-zinc-500">
                  {filtered.length} result(s)
                </div>
                <div className="divide-y divide-gray-100">
                  {filtered.map((job) => (
                    <div
                      key={job.id}
                      className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between hover:bg-gray-50 cursor-pointer"
                      onClick={() => setDetailsJob(job)}
                    >
                      <div className="flex flex-1 flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-sm font-semibold text-zinc-900">{job.title}</div>
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700">
                            {job.status as any}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                          {job.location && <span>📍 {job.location}</span>}
                          {job.salary && (
                            <>
                              <span>•</span>
                              <span>💰 {job.salary}</span>
                            </>
                          )}
                          {job.company && (
                            <>
                              <span>•</span>
                              <span>{job.company}</span>
                            </>
                          )}
                        </div>
                        {job.description && (
                          <p className="text-xs text-zinc-600 line-clamp-2">
                            {job.description}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-none flex-wrap items-center justify-start gap-2 text-xs sm:justify-end">
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            handlePublish(job);
                          }}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-medium text-white ${
                            (job.status as any) === 'PUBLISHED'
                              ? 'bg-emerald-600 hover:bg-emerald-700 border-emerald-600'
                              : 'bg-indigo-600 hover:bg-indigo-700 border-indigo-600'
                          }`}
                          title={
                            (job.status as any) === 'PUBLISHED'
                              ? 'Share public link'
                              : 'Publish and share'
                          }
                        >
                          {(job.status as any) === 'PUBLISHED' ? 'Share' : 'Publish'}
                        </button>
                        {(job.status as any) === 'PUBLISHED' && (
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              window.open(`/jobs/${job.id}`, '_blank');
                            }}
                            className="px-3 py-1.5 rounded-lg border text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                          >
                            View
                          </button>
                        )}
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            handleEdit(job);
                          }}
                          className="px-3 py-1.5 rounded-lg border text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDelete(job.id!);
                          }}
                          className="px-3 py-1.5 rounded-lg border text-xs font-medium text-red-600 border-red-300 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {showForm && (
          <Modal open={showForm} onClose={handleCancel}>
            <div style={{ padding: '24px' }}>
              <h2 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
                {editingJob ? 'Edit Job' : 'Create New Job'}
              </h2>
              {formError && (
                <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px', borderRadius: '6px', marginBottom: '16px', fontSize: '14px' }}>
                  {formError}
                </div>
              )}
              <JobForm initial={editingJob || undefined} onSubmit={handleSubmit} onCancel={handleCancel} />
            </div>
          </Modal>
        )}

        <DetailPanel
          open={!!detailsJob}
          title={detailsJob?.title ?? ''}
          onClose={() => setDetailsJob(null)}
          footer={detailsJob ? (
            <>
              <button onClick={() => { setDetailsJob(null); handleEdit(detailsJob); }} className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">Edit</button>
              <button onClick={() => { if (detailsJob?.id) handlePublish(detailsJob); }} className="rounded-lg border px-3 py-2 text-sm bg-indigo-600 text-white hover:bg-indigo-700">{(detailsJob.status as any) === 'PUBLISHED' ? 'Share' : 'Publish'}</button>
              {(detailsJob?.status as any) === 'PUBLISHED' && (
                <button onClick={() => { if (detailsJob?.id) window.open(`/jobs/${detailsJob.id}`, '_blank'); }} className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">View</button>
              )}
              {detailsJob?.id && (
                <button onClick={() => { const id = detailsJob.id!; setDetailsJob(null); handleDelete(id); }} className="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-600 hover:bg-red-50">Delete</button>
              )}
            </>
          ) : undefined}
        >
          {detailsJob && (
            <div className="space-y-4">
              <div className="text-sm text-gray-600 flex flex-wrap items-center gap-3">
                {detailsJob.location && <span>📍 {detailsJob.location}</span>}
                {detailsJob.salary && <span>💰 {detailsJob.salary}</span>}
                {detailsJob.status && <span className="ml-auto inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs">{detailsJob.status as any}</span>}
              </div>

              {detailsJob.description && (
                <section className="rounded-xl border p-4">
                  <h3 className="font-medium mb-1">Job Description</h3>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{detailsJob.description}</p>
                </section>
              )}

              {detailsJob.requirements && (
                <section className="rounded-xl border p-4">
                  <h3 className="font-medium mb-1">Requirements</h3>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{detailsJob.requirements}</p>
                </section>
              )}

              {(detailsJob.company || detailsJob.department) && (
                <section className="rounded-xl border p-4">
                  <h3 className="font-medium mb-1">Company</h3>
                  <div className="text-sm text-gray-800">{detailsJob.company ?? '—'} {detailsJob.department ? `· ${detailsJob.department}` : ''}</div>
                </section>
              )}
            </div>
          )}
        </DetailPanel>

        {shareJob && shareJob.id && (
          <Modal open={!!shareJob} onClose={() => setShareJob(null)}>
            <div style={{ padding: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#111827' }}>Share your job</h3>
              <p style={{ margin: '8px 0 16px 0', color: '#4b5563', fontSize: '14px' }}>Send candidates a public link to view details or apply.</p>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="text-sm text-zinc-500 w-24">Details</div>
                  <input readOnly value={getPublicLinks(shareJob.id).details} className="flex-1 px-3 py-2 rounded-lg border bg-zinc-50" />
                  <button onClick={() => copyToClipboard(getPublicLinks(shareJob.id!).details)} className="px-3 py-2 rounded-lg border text-sm hover:bg-zinc-50">Copy</button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm text-zinc-500 w-24">Apply</div>
                  <input readOnly value={getPublicLinks(shareJob.id).apply} className="flex-1 px-3 py-2 rounded-lg border bg-zinc-50" />
                  <button onClick={() => copyToClipboard(getPublicLinks(shareJob.id!).apply)} className="px-3 py-2 rounded-lg border text-sm hover:bg-zinc-50">Copy</button>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-emerald-600 h-5">{copyMsg || ''}</div>
                <div className="flex gap-2">
                  <button onClick={() => { window.open(getPublicLinks(shareJob.id!).details, '_blank'); }} className="px-3 py-2 rounded-lg border text-sm hover:bg-zinc-50">Open details</button>
                  <button onClick={() => { window.open(getPublicLinks(shareJob.id!).apply, '_blank'); }} className="px-3 py-2 rounded-lg border text-sm hover:bg-zinc-50">Open apply</button>
                  <button onClick={() => setShareJob(null)} className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700">Done</button>
                </div>
              </div>
            </div>
          </Modal>
        )}
      </PageShell>
    </SimpleConnectionGuard>
  );
}
