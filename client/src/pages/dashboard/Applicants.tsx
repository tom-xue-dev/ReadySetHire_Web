import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation, Link } from "react-router-dom";
import { PencilIcon, TrashIcon, ArrowLeftIcon, PlusIcon,  UserPlusIcon, PlayIcon, EyeIcon } from "@heroicons/react/24/solid";
import Button from "../../components/ui/Button.js";
import Card from "../../components/ui/Card.js";
import Modal from "../components/Modal";
import { SimpleConnectionIndicator, SimpleConnectionGuard } from "../components/SimpleConnectionStatus";
import { useAuth } from "../auth/AuthContext.js";
// @ts-ignore JS helper
import { getApplicantsByInterview, getAllApplicants, bindApplicantToInterviewV2, unbindApplicantFromInterview, createApplicant, updateApplicant, deleteApplicant } from "../api/helper.js";

type Applicant = {
  id: number;
  firstname: string;
  surname: string;
  phoneNumber?: string;
  emailAddress?: string;
  phone_number?: string;
  email_address?: string;
  applicantInterviews?: Array<{
    id: number;
    interviewStatus: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
    interview: {
      id: number;
      title: string;
      jobRole: string;
      job?: {
        id: number;
        title: string;
      };
    };
  }>;
};

type FormApplicant = {
  firstname: string;
  surname: string;
  phoneNumber?: string;
  emailAddress?: string;
};

// Utility components
function Breadcrumb({ interviewId, onBack }: { interviewId: number; onBack: () => void }) {
  return (
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
        <Button variant="ghost" onClick={onBack} className="flex items-center gap-1 p-1">
          <ArrowLeftIcon className="h-4 w-4" />
        </Button>
        <Link to={`/interviews/${interviewId}/applicants`} className="hover:underline cursor-pointer">
          <span className="hover:underline cursor-pointer">Applicants</span>
        </Link>
        <span>/</span>
        <Link to={`/interviews/${interviewId}/questions`} className="hover:underline cursor-pointer">
          <span className="hover:underline cursor-pointer">Questions</span>
        </Link>
      </div>
  );
}

function Toolbar({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  onAdd,
  onAddExisting,
}: {
  search: string;
  setSearch: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  onAdd: () => void;
  onAddExisting: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 items-center gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email, phone…"
          className="px-3 py-2 border rounded-lg flex-1 max-w-md"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="ALL">All status</option>
          <option value="NOT_STARTED">Not Started</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" className="flex items-center gap-1" onClick={onAddExisting}>
          <UserPlusIcon className="h-4 w-4" />Add Existing
        </Button>
        <Button className="flex items-center gap-1" onClick={onAdd}>
          <PlusIcon className="h-4 w-4" />New Applicant
        </Button>
      </div>
    </div>
  );
}

export default function Applicant() {
  const { interviewId: interviewIdParam } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const interviewId = interviewIdParam ? Number(interviewIdParam) : undefined;
  const urlParams = new URLSearchParams(location.search);
  const filterParam = (urlParams.get('filter') || '').toLowerCase();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selected, setSelected] = useState<number[]>([]);
  
  const [showApplicantDialog, setShowApplicantDialog] = useState(false);
  const [draftApplicant, setDraftApplicant] = useState<Partial<FormApplicant>>({});
  const [editingApplicant, setEditingApplicant] = useState<Applicant | null>(null);
  
  const [existingOpen, setExistingOpen] = useState(false);
  const [existing, setExisting] = useState<Applicant[]>([]);
  const [existingQ, setExistingQ] = useState("");
  const [existingLoading, setExistingLoading] = useState(false);
  
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  async function load() {
    if (!interviewId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getApplicantsByInterview(interviewId);
      setApplicants(Array.isArray(data) ? (data as Applicant[]) : []);
    } catch (e: any) {
      setError(e?.message ?? "Load failed");
    } finally {
      setLoading(false);
    }
  }

  function getStatusForRow(row: Applicant): string | undefined {
    const ai = row.applicantInterviews?.find(x => x.interview.id === interviewId);
    return ai?.interviewStatus;
  }
  async function openExistingModal() {
    if (!interviewId) return;
    setExistingLoading(true);
    setExistingQ("");
    try {
      const all = await getAllApplicants();
      const list: Applicant[] = Array.isArray(all) ? all as Applicant[] : [];
      // Exclude already bound to this interview
      const unbound = list.filter((a) => !a.applicantInterviews?.some(ai => ai.interview.id === interviewId));
      setExisting(unbound);
      setExistingOpen(true);
    } catch (e) {
      setError((e as any)?.message ?? 'Load existing failed');
    } finally {
      setExistingLoading(false);
    }
  }

  const filteredExisting = useMemo(() => {
    const q = existingQ.trim().toLowerCase();
    if (!q) return existing;
    return existing.filter(a => `${a.firstname} ${a.surname} ${(a as any).emailAddress || (a as any).email_address || ''}`.toLowerCase().includes(q));
  }, [existing, existingQ]);

  async function handleBindExisting(applicantId: number) {
    if (!interviewId) return;
    try {
      await bindApplicantToInterviewV2(interviewId, applicantId, 'NOT_STARTED');
      setExistingOpen(false);
      await load();
    } catch (e) {
      alert((e as any)?.message ?? 'Bind failed');
    }
  }


  useEffect(() => { load(); }, [interviewId]);

  // Sync URL filter=completed|not-started to local statusFilter once
  useEffect(() => {
    if (filterParam === 'completed') setStatusFilter('COMPLETED');
    if (filterParam === 'not-started') setStatusFilter('NOT_STARTED');
  }, [filterParam]);

  // Actions
  const handleCreateApplicant = () => {
    if (!draftApplicant.firstname || !draftApplicant.surname || !draftApplicant.emailAddress) {
      alert("Please fill required fields: first name, surname, and email");
      return;
    }
    const applicantData: FormApplicant = {
      firstname: draftApplicant.firstname!,
      surname: draftApplicant.surname!,
      emailAddress: draftApplicant.emailAddress!,
      phoneNumber: draftApplicant.phoneNumber,
    };
    handleCreate(applicantData);
  };

  const handleEditApplicant = () => {
    if (!editingApplicant || !draftApplicant.firstname || !draftApplicant.surname || !draftApplicant.emailAddress) {
      alert("Please fill required fields: first name, surname, and email");
      return;
    }
    const applicantData: FormApplicant = {
      firstname: draftApplicant.firstname!,
      surname: draftApplicant.surname!,
      emailAddress: draftApplicant.emailAddress!,
      phoneNumber: draftApplicant.phoneNumber,
    };
    handleUpdate(editingApplicant.id, applicantData);
  };

  const openEditDialog = (applicant: Applicant) => {
    setEditingApplicant(applicant);
    setDraftApplicant({
      firstname: applicant.firstname,
      surname: applicant.surname,
      emailAddress: applicant.emailAddress || applicant.email_address,
      phoneNumber: applicant.phoneNumber || applicant.phone_number,
    });
    setShowApplicantDialog(true);
  };

  const closeDialog = () => {
    setShowApplicantDialog(false);
    setEditingApplicant(null);
    setDraftApplicant({});
  };

  const handleDelete = (id: number) => {
    if (!interviewId) return;
    setConfirmDeleteId(null);
    unbindApplicantFromInterview(id, interviewId).then(() => {
      alert("Applicant removed from interview");
      load();
    }).catch((e: any) => {
      alert(e?.message ?? 'Remove failed');
    });
  };

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return applicants.filter((a) => {
      const name = `${a.firstname ?? ''} ${a.surname ?? ''}`.toLowerCase();
      const email = String(a.emailAddress ?? a.email_address ?? '').toLowerCase();
      const phone = String(a.phoneNumber ?? a.phone_number ?? '').toLowerCase();
      const matchText = !query || `${name} ${email} ${phone}`.includes(query);
      const st = getStatusForRow(a);
      const matchStatus = statusFilter === 'ALL' || st === statusFilter;
      return matchText && matchStatus;
    });
  }, [applicants, search, statusFilter, interviewId]);

  const allSelected = selected.length === filtered.length && filtered.length > 0;
  const toggleAll = (checked: boolean) => {
    if (checked) setSelected(filtered.map(a => a.id));
    else setSelected([]);
  };
  const toggleOne = (id: number, checked: boolean) => {
    if (checked) setSelected((prev) => [...prev, id]);
    else setSelected((prev) => prev.filter((x) => x !== id));
  };


  async function handleCreate(values: FormApplicant) {
    if (!user?.id) {
      alert('User not authenticated');
      return;
    }
    
    try {
      const applicantData = {
        ...values,
        owner_id: user.id
      };
      
      await createApplicant(applicantData);
      setShowApplicantDialog(false);
      setDraftApplicant({});
      await load();
      alert("Applicant created");
    } catch (e) {
      alert((e as any)?.message ?? 'Create failed');
    }
  }

  async function handleUpdate(id: number, values: FormApplicant) {
    if (!user?.id) {
      alert('User not authenticated');
      return;
    }
    
    try {
      const applicantData = {
        ...values,
        owner_id: user.id
      };
      
      await updateApplicant(id, applicantData);
      closeDialog();
      await load();
      alert("Applicant updated");
    } catch (e) {
      alert((e as any)?.message ?? 'Update failed');
    }
  }

  return (
    <SimpleConnectionGuard>
      <div className="p-6 space-y-6">
        <Breadcrumb interviewId={interviewId!} onBack={() => navigate('/interviews')} />
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Applicants for interview {interviewId}</h1>
            <p className="text-sm text-gray-600">Manage applicants for this interview</p>
          </div>
          <div className="flex items-center gap-2">
              <SimpleConnectionIndicator />
          </div>
        </div>

        <Card className="border-2 border-dashed border-gray-200">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Applicants</h2>
          </div>
          <div className="p-4 space-y-4">
            <Toolbar
              search={search}
              setSearch={setSearch}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              onAdd={() => setShowApplicantDialog(true)}
              onAddExisting={openExistingModal}
            />

            {error && (
              <div className="text-red-600 bg-red-50 border border-red-200 rounded p-3">
                Error: {error}
              </div>
            )}

            <div className="rounded-xl border overflow-hidden bg-white">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-10 px-4 py-3 text-left">
                      <input type="checkbox" checked={allSelected} onChange={(e) => toggleAll(e.target.checked)} aria-label="Select all" />
                    </th>
                    <th className="w-16 px-4 py-3 text-left text-sm font-medium text-gray-600">ID</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Email</th>
                    <th className="w-36 px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                    <th className="w-24 px-4 py-3 text-left text-sm font-medium text-gray-600">Score</th>
                    <th className="w-16 px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-500">Loading...</td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-500">No applicants found</td>
                    </tr>
                  ) : (
                    filtered.map((a) => {
                      const status = getStatusForRow(a);
                      const isCompletedView = filterParam === 'completed';
                      return (
                        <tr key={a.id} className="border-t hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <input type="checkbox" checked={selected.includes(a.id)} onChange={(e) => toggleOne(a.id, e.target.checked)} aria-label={`Select applicant ${a.id}`} />
                          </td>
                          <td className="px-4 py-3 text-gray-500">{a.id}</td>
                          <td className="px-4 py-3 font-medium">{a.firstname} {a.surname}</td>
                          <td className="px-4 py-3">{a.emailAddress || a.email_address}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              status === "COMPLETED" ? "bg-green-100 text-green-700" :
                              status === "IN_PROGRESS" ? "bg-blue-100 text-blue-700" :
                              status === "NOT_STARTED" ? "bg-yellow-100 text-yellow-700" :
                              "bg-gray-100 text-gray-700"
                            }`}>
                              {status?.replace("_", " ") || "Not Bound"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500">—</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center gap-1">
                              {isCompletedView ? (
                                <Button variant="ghost" onClick={() => navigate(`/interview-answers/${interviewId}/${a.id}`)} className="p-1"><EyeIcon className="h-4 w-4" /></Button>
                              ) : (
                                <Button variant="ghost" onClick={() => navigate(`/interview-welcome/${interviewId}/${a.id}`)} disabled={status === 'COMPLETED'} className="p-1"><PlayIcon className="h-4 w-4" /></Button>
                              )}
                              <Button variant="ghost" onClick={() => openEditDialog(a)} className="p-1"><PencilIcon className="h-4 w-4" /></Button>
                              <Button variant="ghost" onClick={() => setConfirmDeleteId(a.id)} className="p-1 text-red-600"><TrashIcon className="h-4 w-4" /></Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                <div className="text-sm text-gray-600">{filtered.length} result(s)</div>
            </div>
            </div>
          </div>
        </Card>

        {/* Create/Edit Applicant Dialog */}
        <Modal 
          open={showApplicantDialog} 
          title={editingApplicant ? "Edit Applicant" : "New Applicant"} 
          onClose={closeDialog}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input 
                  className="w-full px-3 py-2 border rounded-lg" 
                  placeholder="John" 
                  value={draftApplicant.firstname ?? ""} 
                  onChange={(e) => setDraftApplicant({ ...draftApplicant, firstname: e.target.value })} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input 
                  className="w-full px-3 py-2 border rounded-lg" 
                  placeholder="Doe" 
                  value={draftApplicant.surname ?? ""} 
                  onChange={(e) => setDraftApplicant({ ...draftApplicant, surname: e.target.value })} 
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input 
                className="w-full px-3 py-2 border rounded-lg" 
                type="email" 
                placeholder="john.doe@example.com" 
                value={draftApplicant.emailAddress ?? ""} 
                onChange={(e) => setDraftApplicant({ ...draftApplicant, emailAddress: e.target.value })} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
              <input 
                className="w-full px-3 py-2 border rounded-lg" 
                placeholder="+1234567890" 
                value={draftApplicant.phoneNumber ?? ""} 
                onChange={(e) => setDraftApplicant({ ...draftApplicant, phoneNumber: e.target.value })} 
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button onClick={editingApplicant ? handleEditApplicant : handleCreateApplicant}>
                {editingApplicant ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Add Existing Applicant Dialog */}
        {/* Add Existing Applicant Dialog */}
        <Modal 
          open={existingOpen} 
          title="Add Existing Applicant" 
          onClose={() => setExistingOpen(false)}
        >
          <div className="space-y-4">
            <input
              className="w-full px-3 py-2 border rounded-lg" 
              value={existingQ}
              onChange={(e) => setExistingQ(e.target.value)}
              placeholder="Search name or email…"
            />
            {existingLoading ? (
              <div className="text-sm text-gray-500 py-4">Loading…</div>
            ) : filteredExisting.length === 0 ? (
              <div className="text-sm text-gray-500 py-4">No candidates found</div>
            ) : (
              <div className="max-h-80 overflow-y-auto space-y-2">
                {filteredExisting.map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{a.firstname} {a.surname}</div>
                      <div className="text-xs text-gray-500 truncate">
                        {(a as any).emailAddress || (a as any).email_address}
                      </div>
                    </div>
                    <Button onClick={() => handleBindExisting(a.id)}>Add</Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>

        {/* Confirm Delete */}
        {/* Confirm Delete */}
        {confirmDeleteId !== null && (
          <Modal 
            open={true} 
            title="Remove applicant?" 
            onClose={() => setConfirmDeleteId(null)}
          >
            <div className="space-y-4">
              <p className="text-gray-600">
                This will remove the applicant from this interview. The applicant record will remain in the system.
              </p>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
                <Button 
                  onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Remove
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </SimpleConnectionGuard>
  );
}

