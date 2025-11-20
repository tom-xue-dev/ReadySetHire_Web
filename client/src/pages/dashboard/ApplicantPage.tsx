import { useEffect, useMemo, useState } from "react";
import DataTable from "../components/DataTable";
import type { Column } from "../components/DataTable";
import Modal from "../components/Modal";
import ApplicantForm from "../components/ApplicantForm";
import type { Applicant as FormApplicant } from "../components/ApplicantForm";
  import { PencilIcon, TrashIcon, LinkIcon } from "@heroicons/react/24/solid";
import { useAuth } from "./auth/AuthContext.js";
import { SimpleConnectionIndicator, SimpleConnectionGuard } from "../components/SimpleConnectionStatus";
// @ts-ignore JS helper
import { getAllApplicants, createApplicant, updateApplicant, deleteApplicant } from "../api/helper.js";

type Interview = { 
  id: number; 
  title: string;
  job?: {
    id: number;
    title: string;
  };
};

type Applicant = {
  id: number;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  emailAddress: string;
  interviewId?: number;
  interviewStatus?: string;
  interview?: Interview;
};

type Row = {
  id: number;
  name: string;
  email: string;
  phone: string;
  interviewTitle: string;
  jobTitle: string;
  status: string;
  interviewId?: number;
};

export default function ApplicantPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState<Row | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"ALL" | "BOUND" | "UNBOUND" | "COMPLETED">("ALL");

  useEffect(() => {
    async function load() {
      console.log("ApplicantPage: Starting load function");
      setLoading(true);
      setError(null);
      try {
        console.log("ApplicantPage: Calling getAllApplicants()");
        const applicants: Applicant[] = await getAllApplicants();
        console.log("ApplicantPage: Received applicants", applicants);
        
        // Process applicants with their interview data
        const rows: Row[] = applicants.map(applicant => {
          // Handle both camelCase and snake_case from backend
          const firstName = applicant.firstName || (applicant as any).firstname || '';
          const lastName = applicant.lastName || (applicant as any).surname || '';
          
          if (applicant.interview) {
            // Applicant is bound to an interview
            return {
              id: applicant.id,
              name: `${firstName} ${lastName}`.trim(),
              email: applicant.emailAddress ?? '',
              phone: applicant.phoneNumber ?? '',
              interviewTitle: applicant.interview.title,
              jobTitle: applicant.interview.job?.title ?? 'N/A',
              status: applicant.interviewStatus ?? 'NOT_STARTED',
              interviewId: applicant.interview.id,
            };
          } else {
            // Applicant is not bound to an interview
            return {
              id: applicant.id,
              name: `${firstName} ${lastName}`.trim(),
              email: applicant.emailAddress ?? '',
              phone: applicant.phoneNumber ?? '',
              interviewTitle: 'Not Bound',
              jobTitle: 'N/A',
              status: 'Not Bound',
              interviewId: undefined,
            };
          }
        });
        
        console.log("ApplicantPage: Processed rows", rows);
        setRows(rows);
      } catch (e: any) {
        console.error("ApplicantPage: Error occurred", e);
        setError(e?.message ?? 'Load failed');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleCreate(values: FormApplicant) {
    if (!user?.id) {
      alert('User not authenticated');
      return;
    }
    
    try {
      // Add ownerId to the applicant data (in camelCase)
      const applicantData = {
        ...values,
        ownerId: user.id
      };
      
      await createApplicant(applicantData);
      setCreateOpen(false);
      // Reload data
      window.location.reload(); // Simple reload for now
    } catch (e) {
      alert((e as any)?.message ?? 'Create failed');
    }
  }

  async function handleUpdate(values: FormApplicant) {
    if (!editOpen?.id) return;
    if (!user?.id) {
      alert('User not authenticated');
      return;
    }
    
    try {
      // Add ownerId to the applicant data (in camelCase)
      const applicantData = {
        ...values,
        ownerId: user.id
      };
      
      await updateApplicant(editOpen.id, applicantData);
      setEditOpen(null);
      // Reload data
      window.location.reload(); // Simple reload for now
    } catch (e) {
      alert((e as any)?.message ?? 'Update failed');
    }
  }

  async function handleDelete(row: Row) {
    if (!confirm(`Delete applicant #${row.id}?`)) return;
    try {
      await deleteApplicant(row.id);
      // Reload data
      window.location.reload(); // Simple reload for now
    } catch (e) {
      alert((e as any)?.message ?? 'Delete failed');
    }
  }

  const totals = useMemo(() => {
    const total = rows.length;
    const bound = rows.filter(r => r.interviewId).length;
    const completed = rows.filter(r => r.status === 'COMPLETED').length;
    const unbound = total - bound;
    return { total, bound, unbound, completed };
  }, [rows]);

  const filteredRows = useMemo(() => {
    const query = q.trim().toLowerCase();
    return rows.filter(r => {
      const byText = !query || `${r.name} ${r.email} ${r.phone} ${r.interviewTitle} ${r.jobTitle}`.toLowerCase().includes(query);
      const byFilter = (
        filter === 'ALL' ||
        (filter === 'BOUND' && !!r.interviewId) ||
        (filter === 'UNBOUND' && !r.interviewId) ||
        (filter === 'COMPLETED' && r.status === 'COMPLETED')
      );
      return byText && byFilter;
    });
  }, [rows, q, filter]);

  const columns: Column<Row>[] = useMemo(() => [
    { header: 'ID', accessor: 'id', width: 70 },
    { header: 'Name', accessor: 'name' },
    { header: 'Email', accessor: 'email', width: 220 },
    { header: 'Phone', accessor: 'phone', width: 160 },
    { header: 'Interview', accessor: 'interviewTitle' },
    { header: 'Job', accessor: 'jobTitle' },
    { header: 'Status', accessor: 'status', width: 140 },
    {
      header: 'Actions', width: 200,
      render: (row: Row) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setEditOpen(row)} aria-label="Edit" style={iconBtn}>
            <PencilIcon width={18} height={18} style={{ color: '#2563eb' }} />
          </button>
          <button onClick={() => handleDelete(row)} aria-label="Delete" style={iconBtn}>
            <TrashIcon width={18} height={18} style={{ color: '#ef4444' }} />
          </button>
          {row.interviewId && (
            <button
              onClick={async () => {
                const link = `${window.location.origin}/interviews/${row.interviewId}`;
                try {
                  await navigator.clipboard.writeText(link);
                  alert('Link copied');
                } catch {
                  alert('Link: ' + link);
                }
              }}
              style={iconBtn}
              aria-label="Copy Link"
            >
              <LinkIcon width={18} height={18} style={{ color: '#059669' }} />
            </button>
          )}
        </div>
      )
    }
  ], []);

  return (
    <SimpleConnectionGuard>
      <div className="min-h-screen bg-zinc-50">
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-zinc-900">Applicants</h1>
              <SimpleConnectionIndicator />
            </div>
            <div className="flex-1" />
            <button
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-3 py-2 rounded-xl shadow hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-600"
            >
              New Applicant
            </button>
          </div>
        </header>

        <main className="max-w-7xl mx-auto p-4 grid grid-cols-12 gap-4">
          <aside className="col-span-12 md:col-span-3 space-y-4">
            <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm">
              <div className="text-sm text-zinc-600 mb-2">Filters</div>
              <div className="space-y-3">
                <div className="relative">
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search name, email, phone…"
                    className="w-full pl-3 pr-3 py-2 rounded-xl border bg-white focus:outline-none focus:ring"
                  />
                </div>
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Status</div>
                  <div className="flex flex-wrap gap-2">
                    {(["ALL","BOUND","UNBOUND","COMPLETED"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setFilter(s)}
                        className={`px-2 py-1 rounded-full border text-xs transition ${filter===s ? 'bg-black text-white border-black' : 'bg-white hover:bg-zinc-50'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="pt-2 flex gap-2">
                  <button onClick={() => { setQ(''); setFilter('ALL'); }} className="px-3 py-2 rounded-xl border text-sm">Reset</button>
                </div>
              </div>
            </div>

            <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm">
              <div className="text-sm text-zinc-600 mb-2">Totals</div>
              <div className="text-sm grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-zinc-50 border">
                  <div className="text-xs text-zinc-500">Total</div>
                  <div className="text-lg font-semibold">{totals.total}</div>
                </div>
                <div className="p-3 rounded-xl bg-zinc-50 border">
                  <div className="text-xs text-zinc-500">Bound</div>
                  <div className="text-lg font-semibold">{totals.bound}</div>
                </div>
                <div className="p-3 rounded-xl bg-zinc-50 border">
                  <div className="text-xs text-zinc-500">Unbound</div>
                  <div className="text-lg font-semibold">{totals.unbound}</div>
                </div>
                <div className="p-3 rounded-xl bg-zinc-50 border">
                  <div className="text-xs text-zinc-500">Completed</div>
                  <div className="text-lg font-semibold">{totals.completed}</div>
                </div>
              </div>
            </div>
          </aside>

          <section className="col-span-12 md:col-span-9">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded mb-3">Error: {error}</div>
            )}
            <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b bg-white text-sm text-zinc-500">{filteredRows.length} result(s)</div>
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="p-6 text-sm text-zinc-500">Loading…</div>
                ) : (
                  <DataTable columns={columns} data={filteredRows} rowKey={(r) => r.id} emptyText="No applicants" />
                )}
              </div>
            </div>
          </section>
        </main>

        <Modal open={createOpen} title="Create Applicant" onClose={() => setCreateOpen(false)}>
          <ApplicantForm onSubmit={handleCreate} onCancel={() => setCreateOpen(false)} />
        </Modal>

        <Modal open={!!editOpen} title={`Edit Applicant #${editOpen?.id ?? ''}`} onClose={() => setEditOpen(null)}>
          {editOpen && (
            <ApplicantForm 
              initial={{
                id: editOpen.id,
                firstName: editOpen.name.split(' ')[0] || '',
                lastName: editOpen.name.split(' ').slice(1).join(' ') || '',
                phoneNumber: editOpen.phone,
                emailAddress: editOpen.email
              }} 
              onSubmit={handleUpdate} 
              onCancel={() => setEditOpen(null)} 
            />
          )}
        </Modal>
      </div>
    </SimpleConnectionGuard>
  );
}

const iconBtn: React.CSSProperties = { border: 'none', background: 'transparent', cursor: 'pointer', padding: 2 };
