import { useEffect, useMemo, useState } from "react";
import DataTable from "../components/DataTable";
import type { Column } from "../components/DataTable";
import Modal from "../components/Modal";
import InterviewForm from "../components/InterviewForm";
import type { Interview as FormInterview } from "../types";
import { TrashIcon, PencilIcon, EyeIcon } from "@heroicons/react/24/solid";
import { useNavigate } from "react-router-dom";
import { SimpleConnectionIndicator, SimpleConnectionGuard } from "../components/SimpleConnectionStatus";

// API helpers (JS module)
// @ts-ignore
import { getInterviews, createInterview, updateInterview, deleteInterview, getQuestions, getApplicantsByInterview } from "../api/helper.js";

type Interview = Required<FormInterview> & { id: number };
type Counts = Record<number, { questions: number; applicants: number; completed: number; notStarted: number }>;

type Status = Interview["status"] | "ALL";

function StatusBadge({ value }: { value: Interview["status"] }) {
  const map: Record<string, string> = {
    DRAFT: "bg-amber-50 text-amber-700 ring-amber-200",
    ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    CLOSED: "bg-zinc-100 text-zinc-700 ring-zinc-200",
  };
  const dot: Record<string, string> = {
    DRAFT: "bg-amber-500",
    ACTIVE: "bg-emerald-500",
    CLOSED: "bg-zinc-500",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] ring-1 ${map[value]}`}>
      <span className={`w-2 h-2 rounded-full ${dot[value]}`} />
      {value}
    </span>
  );
}

export default function Interviews() {
  const navigate = useNavigate();
  const [, setLoading] = useState(false);
  const [, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Interview[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState<Interview | null>(null);
  const [counts, setCounts] = useState<Counts>({});

  // NEW: local UI states (search/filter/sort)
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<Status>("ALL");
  const [sort] = useState<{ key: keyof Interview | "updatedAt" | "id"; dir: "asc" | "desc" }>({ key: "id", dir: "asc" });

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await getInterviews();
      const list: Interview[] = Array.isArray(data) ? (data as Interview[]) : [];
      setItems(list);

      // fetch counts per interview
      const entries = await Promise.all(
        list.map(async (iv) => {
          try {
            const [qs, apps] = await Promise.all([
              getQuestions(iv.id),
              getApplicantsByInterview(iv.id),
            ]);
            const qCount = Array.isArray(qs) ? qs.length : 0;
            const aList = Array.isArray(apps) ? apps : [];
            const total = aList.length;
            // Count by ApplicantInterview relation status (Prisma enums)
            const statuses: string[] = aList
              .map((ap: any) => {
                const rel = Array.isArray(ap?.applicantInterviews)
                  ? ap.applicantInterviews.find((ai: any) => ai?.interviewId === iv.id) || ap.applicantInterviews[0]
                  : undefined;
                return rel?.interviewStatus as string | undefined;
              })
              .filter((s: any) => typeof s === "string") as string[];
            const completed = statuses.filter((s) => s === "COMPLETED").length;
            const notStarted = statuses.filter((s) => s === "NOT_STARTED").length;
            return [iv.id, { questions: qCount, applicants: total, completed, notStarted }] as const;
          } catch {
            return [iv.id, { questions: 0, applicants: 0, completed: 0, notStarted: 0 }] as const;
          }
        })
      );
      const map: Counts = {};
      entries.forEach(([id, val]) => {
        map[id] = val;
      });
      setCounts(map);
    } catch (e: any) {
      setError(e?.message ?? "Load failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Derived list
  const filtered = useMemo(() => {
    const byText = (it: Interview) =>
      !q || `${it.title} ${it.jobRole}`.toLowerCase().includes(q.toLowerCase());
    const byStatus = (it: Interview) => status === "ALL" || it.status === status;
    return items.filter((it) => byText(it) && byStatus(it));
  }, [items, q, status]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const dir = sort.dir === "asc" ? 1 : -1;
      if (sort.key === "id") return (a.id - b.id) * dir;
      if (sort.key === "title") return a.title.localeCompare(b.title) * dir;
      if (sort.key === "jobRole") return a.jobRole.localeCompare(b.jobRole) * dir;
      if (sort.key === "status") return a.status.localeCompare(b.status) * dir;
      // fallback
      return (a.id - b.id) * dir;
    });
    return arr;
  }, [filtered, sort]);

  // Columns
  const columns: Column<Interview>[] = useMemo(
    () => [
      { header: "ID", accessor: "id", width: 70 },
      {
        header: "Title",
        accessor: "title",
        render: (row) => (
          <button
            className="text-left text-zinc-900 font-medium hover:underline"
            onClick={() => navigate(`/interviews/${row.id}/questions`)}
          >
            {row.title}
          </button>
        ),
      },
      { header: "Job Role", accessor: "jobRole" },
      {
        header: "Status",
        accessor: "status",
        width: 120,
        render: (row) => <StatusBadge value={row.status} />,
      },
      {
        header: "Questions",
        width: 160,
        render: (row) => (
          <button
            onClick={() => navigate(`/interviews/${row.id}/questions`)}
            className="inline-flex items-center gap-1 text-indigo-600 hover:underline"
          >
            {counts[row.id]?.questions ?? "…"} question(s)
          </button>
        ),
      },
      {
        header: "Applicants",
        width: 260,
        render: (row) => (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <button
              onClick={() => navigate(`/interviews/${row.id}/applicants`)}
              className="text-indigo-600 hover:underline"
            >
              {counts[row.id]?.applicants ?? "…"} total
            </button>
            <span className="text-zinc-300">·</span>
            <button
              onClick={() => navigate(`/interviews/${row.id}/applicants?filter=not-started`)}
              className="text-indigo-600 hover:underline"
            >
              {counts[row.id]?.notStarted ?? 0} Not Started
            </button>
            <span className="text-zinc-300">·</span>
            <button
              onClick={() => navigate(`/interviews/${row.id}/applicants?filter=completed`)}
              className="text-indigo-600 hover:underline"
            >
              {counts[row.id]?.completed ?? 0} Completed
            </button>
          </div>
        ),
      },
      {
        header: "Actions",
        width: 150,
        render: (row) => (
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/interviews/${row.id}/questions`)}
              aria-label="View"
              className="px-2 py-1.5 rounded-lg border hover:bg-zinc-50"
            >
              <EyeIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setEditOpen(row)}
              aria-label="Edit"
              className="px-2 py-1.5 rounded-lg border hover:bg-zinc-50 text-blue-600 border-blue-300"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(row)}
              aria-label="Delete"
              className="px-2 py-1.5 rounded-lg border hover:bg-red-50 text-red-600 border-red-300"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    [counts, navigate]
  );

  async function handleCreate(values: FormInterview) {
    try {
      await createInterview(values);
      setCreateOpen(false);
      await load();
    } catch (e) {
      alert((e as any)?.message ?? "Create failed");
    }
  }

  async function handleUpdate(values: FormInterview) {
    if (!editOpen?.id) return;
    try {
      await updateInterview(editOpen.id, values);
      setEditOpen(null);
      await load();
    } catch (e) {
      alert((e as any)?.message ?? "Update failed");
    }
  }

  async function handleDelete(row: Interview) {
    if (!confirm(`Delete interview #${row.id}?`)) return;
    try {
      await deleteInterview(row.id);
      await load();
    } catch (e) {
      alert((e as any)?.message ?? "Delete failed");
    }
  }

  return (
    <SimpleConnectionGuard>
      <div className="min-h-screen bg-zinc-50">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-zinc-900">Interviews</h1>
              <SimpleConnectionIndicator />
            </div>
            <div className="flex-1" />
            <button
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-3 py-2 rounded-xl shadow hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-600"
            >
              New Interview
            </button>
          </div>
        </header>

        <main className="max-w-7xl mx-auto p-4 grid grid-cols-12 gap-4">
          {/* Sidebar Filters */}
          <aside className="col-span-12 md:col-span-3 space-y-4">
            <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm">
              <div className="text-sm text-zinc-600 mb-2">Filters</div>
              <div className="space-y-3">
                <div className="relative">
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search title or role…"
                    className="w-full pl-3 pr-3 py-2 rounded-xl border bg-white focus:outline-none focus:ring"
                  />
                </div>
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Status</div>
                  <div className="flex flex-wrap gap-2">
                    {(["ALL", "DRAFT", "ACTIVE", "CLOSED"] as Status[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => setStatus(s)}
                        className={`px-2 py-1 rounded-full border text-xs transition ${
                          status === s ? "bg-black text-white border-black" : "bg-white hover:bg-zinc-50"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="pt-2 flex gap-2">
                  <button
                    onClick={() => {
                      setQ("");
                      setStatus("ALL");
                    }}
                    className="px-3 py-2 rounded-xl border text-sm"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            {/* Totals */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm">
              <div className="text-sm text-zinc-600 mb-2">Totals</div>
              <div className="text-sm grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-zinc-50 border">
                  <div className="text-xs text-zinc-500">Active</div>
                  <div className="text-lg font-semibold">{items.filter((r) => r.status === "ACTIVE").length}</div>
                </div>
                <div className="p-3 rounded-xl bg-zinc-50 border">
                  <div className="text-xs text-zinc-500">Draft</div>
                  <div className="text-lg font-semibold">{items.filter((r) => r.status === "DRAFT").length}</div>
                </div>
              </div>
            </div>
          </aside>

          {/* Table */}
          <section className="col-span-12 md:col-span-9">
            <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b bg-white text-sm text-zinc-500">{sorted.length} result(s)</div>
              <div className="overflow-x-auto">
                <DataTable
                  columns={columns}
                  data={sorted}
                  rowKey={(r: Interview) => r.id}
                  emptyText="No interviews"
                  // If your DataTable supports sticky header / custom className, pass them here
                />
              </div>
            </div>
          </section>
        </main>

        {/* Create / Edit modals */}
        <Modal open={createOpen} title="Create Interview" onClose={() => setCreateOpen(false)}>
          <InterviewForm onSubmit={handleCreate} onCancel={() => setCreateOpen(false)} />
        </Modal>

        <Modal open={!!editOpen} title={`Edit Interview #${editOpen?.id ?? ''}`} onClose={() => setEditOpen(null)}>
          {editOpen && (
            <InterviewForm initial={editOpen} onSubmit={handleUpdate} onCancel={() => setEditOpen(null)} />
          )}
        </Modal>
      </div>
    </SimpleConnectionGuard>
  );
}
