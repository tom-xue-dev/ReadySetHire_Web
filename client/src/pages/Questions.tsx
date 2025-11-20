import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { PencilIcon, TrashIcon, ArrowLeftIcon, PlusIcon, SparklesIcon } from "@heroicons/react/24/solid";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Modal from "../components/Modal";
import { SimpleConnectionIndicator, SimpleConnectionGuard } from "../components/SimpleConnectionStatus";
// @ts-ignore JS module
import { getQuestions, createQuestion, updateQuestion, deleteQuestion, generateQuestions } from "../api/api.js";


type Question = {
  id: number;
  question: string;
  difficulty: "EASY" | "INTERMEDIATE" | "ADVANCED";
  username?: string;
  interview_id?: number;
};

type QuestionFormData = {
  question: string;
  difficulty: "EASY" | "INTERMEDIATE" | "ADVANCED";
  interview_id: number;
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
  difficulty,
  setDifficulty,
  onAdd,
  onGenerate,
  onBulkDisable,
  anySelected,
  isGenerating,
}: {
  search: string;
  setSearch: (v: string) => void;
  difficulty: string;
  setDifficulty: (v: string) => void;
  onAdd: () => void;
  onGenerate: () => void;
  onBulkDisable: () => void;
  anySelected: boolean;
  isGenerating: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 items-center gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search question text…"
          className="px-3 py-2 border rounded-lg flex-1 max-w-md"
        />
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="px-3 py-2 border rounded-lg">
          <option value="ALL">All difficulty</option>
          <option value="EASY">Easy</option>
          <option value="INTERMEDIATE">Intermediate</option>
          <option value="ADVANCED">Advanced</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" className="flex items-center gap-1" onClick={onBulkDisable} disabled={!anySelected}>
          Disable ({anySelected ? 'selected' : '0'})
        </Button>
        <Button 
          variant="outline" 
          className="flex items-center gap-1" 
          onClick={onGenerate}
          disabled={isGenerating}
        >
          <SparklesIcon className="h-4 w-4" />
          {isGenerating ? 'Generating...' : 'Generate Questions'}
        </Button>
        <Button className="flex items-center gap-1" onClick={onAdd}>
          <PlusIcon className="h-4 w-4" />New Question
        </Button>
      </div>
    </div>
  );
}

function Questions() {
  const params = useParams();
  const navigate = useNavigate();
  const interviewId = Number(params.id ?? params.interviewId);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("ALL");
  const [selected, setSelected] = useState<number[]>([]);
  
  const [showQuestionDialog, setShowQuestionDialog] = useState(false);
  const [draftQuestion, setDraftQuestion] = useState<Partial<QuestionFormData>>({ difficulty: "EASY" });
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  async function load() {
    if (!interviewId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await getQuestions(interviewId);
      console.log('🔍 Questions API response:', response);
      
      // Extract questions data - handle both wrapped and unwrapped responses
      let questionsList = response;
      if (response && typeof response === 'object' && 'data' in response) {
        questionsList = response.data;
      }
      
      console.log('📝 Extracted questions list:', questionsList);
      
      // Process questions with validation
      const validQuestions: Question[] = (Array.isArray(questionsList) ? questionsList : [])
        .map((q: any) => {
          const questionId = Number(q.id);
          if (isNaN(questionId) || questionId <= 0) {
            console.warn('⚠️ Invalid question ID:', q.id, 'in question:', q);
            return null;
          }
          const question: Question = {
            id: questionId,
            question: String(q.question ?? ''),
            difficulty: q.difficulty as "EASY" | "INTERMEDIATE" | "ADVANCED",
            username: q.username,
            interview_id: q.interviewId || q.interview_id
          };
          return question;
        })
        .filter((q): q is Question => q !== null);
        
      console.log('✅ Valid questions:', validQuestions);
      setQuestions(validQuestions);
    } catch (e: any) {
      setError(e?.message ?? "Load failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [interviewId]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return questions.filter((q) => {
      const matchText = !query || q.question.toLowerCase().includes(query);
      const matchDiff = difficulty === "ALL" || q.difficulty === difficulty;
      return matchText && matchDiff;
    });
  }, [questions, search, difficulty]);

  const allSelected = selected.length === filtered.length && filtered.length > 0;
  const toggleAll = (checked: boolean) => {
    if (checked) setSelected(filtered.map(q => q.id));
    else setSelected([]);
  };
  const toggleOne = (id: number, checked: boolean) => {
    if (checked) setSelected((prev) => [...prev, id]);
    else setSelected((prev) => prev.filter((x) => x !== id));
  };

  // Actions
  const handleCreateQuestion = () => {
    if (!draftQuestion.question || !draftQuestion.difficulty) {
      alert("Please fill question text and difficulty");
      return;
    }
    const questionData: QuestionFormData = {
      question: draftQuestion.question!,
      difficulty: draftQuestion.difficulty!,
      interview_id: interviewId,
    };
    handleCreate(questionData);
  };

  const handleEditQuestion = () => {
    if (!editingQuestion || !draftQuestion.question || !draftQuestion.difficulty) {
      alert("Please fill question text and difficulty");
      return;
    }
    const questionData: QuestionFormData = {
      question: draftQuestion.question!,
      difficulty: draftQuestion.difficulty!,
      interview_id: interviewId,
    };
    handleUpdate(editingQuestion.id, questionData);
  };

  const handleDelete = async (id: number) => {
    if (!confirm(`Delete question #${id}?`)) return;
    try {
      await deleteQuestion(id);
      setConfirmDeleteId(null);
      await load();
      alert('Question deleted successfully');
    } catch (e: any) {
      alert(e?.message ?? 'Delete failed');
    }
  };

  const bulkDisable = () => {
    if (selected.length === 0) return;
    // Since we don't have an enabled field in the API, we'll just show a message
    alert("Bulk disable not implemented - demo only");
    setSelected([]);
  };

  const openEditDialog = (question: Question) => {
    setEditingQuestion(question);
    setDraftQuestion({
      question: question.question,
      difficulty: question.difficulty,
    });
    setShowQuestionDialog(true);
  };

  const closeDialog = () => {
    setShowQuestionDialog(false);
    setEditingQuestion(null);
    setDraftQuestion({ difficulty: "EASY" });
  };

  const handleGenerateQuestions = async () => {
    if (isGenerating) return;
    
    const count = prompt('How many questions would you like to generate?', '5');
    if (!count || isNaN(Number(count))) {
      alert('Please enter a valid number');
      return;
    }
    
    const numQuestions = Math.min(Math.max(1, Number(count)), 10); // Limit to 1-10
    
    if (!confirm(`Generate ${numQuestions} questions using AI based on the job description?`)) {
      return;
    }
    
    setIsGenerating(true);
    try {
      console.log(`🤖 Generating ${numQuestions} questions for interview ${interviewId}`);
      
      const response = await generateQuestions(interviewId, numQuestions);
      console.log('✅ Generation response:', response);
      
      if (response.success) {
        alert(`Successfully generated and saved ${response.data.saved} questions!`);
        await load(); // Reload the questions list
      } else {
        alert(`Generation failed: ${response.error || 'Unknown error'}`);
      }
      
    } catch (error: any) {
      console.error('❌ Question generation failed:', error);
      alert(`Failed to generate questions: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  async function handleCreate(values: QuestionFormData) {
    try {
      await createQuestion(values);
      setShowQuestionDialog(false);
      setDraftQuestion({ difficulty: "EASY" });
      await load();
      alert('Question created successfully');
    } catch (e: any) {
      alert(e?.message ?? 'Create failed');
    }
  }

  async function handleUpdate(id: number, values: QuestionFormData) {
    try {
      await updateQuestion(id, values);
      closeDialog();
      await load();
      alert('Question updated successfully');
    } catch (e: any) {
      alert(e?.message ?? 'Update failed');
    }
  }

  return (
    <SimpleConnectionGuard>
      <div className="p-6 space-y-6">
        <Breadcrumb interviewId={interviewId} onBack={() => navigate('/interviews')} />
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Questions for interview {interviewId}</h1>
            <p className="text-sm text-muted-foreground">Manage questions for this interview</p>
          </div>
          <div className="flex items-center gap-2">
            <SimpleConnectionIndicator />
          </div>
        </div>

        <Card className="border-2 border-dashed border-gray-200">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Questions</h2>
          </div>
          <div className="p-4 space-y-4">
            <Toolbar
              search={search}
              setSearch={setSearch}
              difficulty={difficulty}
              setDifficulty={setDifficulty}
              onAdd={() => setShowQuestionDialog(true)}
              onGenerate={handleGenerateQuestions}
              onBulkDisable={bulkDisable}
              anySelected={selected.length > 0}
              isGenerating={isGenerating}
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
                      <input 
                        type="checkbox" 
                        checked={allSelected} 
                        onChange={(e) => toggleAll(e.target.checked)} 
                        aria-label="Select all" 
                      />
                    </th>
                    <th className="w-16 px-4 py-3 text-left text-sm font-medium text-gray-600">ID</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Question</th>
                    <th className="w-36 px-4 py-3 text-left text-sm font-medium text-gray-600">Difficulty</th>
                    <th className="w-28 px-4 py-3 text-left text-sm font-medium text-gray-600">Owner</th>
                    <th className="w-16 px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-500">
                        Loading...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-500">
                        No questions found
                      </td>
                    </tr>
                  ) : (
                    filtered.map((q) => (
                      <tr key={q.id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <input 
                            type="checkbox" 
                            checked={selected.includes(q.id)} 
                            onChange={(e) => toggleOne(q.id, e.target.checked)} 
                            aria-label={`Select question ${q.id}`} 
                          />
                        </td>
                        <td className="px-4 py-3 text-gray-500">{q.id}</td>
                        <td className="px-4 py-3 font-medium">{q.question}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            q.difficulty === "EASY" ? "bg-green-100 text-green-700" :
                            q.difficulty === "INTERMEDIATE" ? "bg-blue-100 text-blue-700" :
                            "bg-red-100 text-red-700"
                          }`}>
                            {q.difficulty.toLowerCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{q.username || "—"}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" onClick={() => openEditDialog(q)} className="p-1">
                              <PencilIcon className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" onClick={() => setConfirmDeleteId(q.id)} className="p-1 text-red-600">
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                <div className="text-sm text-gray-600">{filtered.length} result(s)</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Create/Edit Question Dialog */}
        <Modal 
          open={showQuestionDialog} 
          title={editingQuestion ? "Edit Question" : "New Question"} 
          onClose={closeDialog}
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="qtext" className="block text-sm font-medium text-gray-700 mb-1">
                Question
              </label>
              <input 
                id="qtext" 
                type="text"
                placeholder="e.g., Explain event loop in Node.js…" 
                value={draftQuestion.question ?? ""} 
                onChange={(e) => setDraftQuestion({ ...draftQuestion, question: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Difficulty
              </label>
              <select 
                value={draftQuestion.difficulty as string} 
                onChange={(e) => setDraftQuestion({ ...draftQuestion, difficulty: e.target.value as "EASY" | "INTERMEDIATE" | "ADVANCED" })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="EASY">Easy</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button onClick={editingQuestion ? handleEditQuestion : handleCreateQuestion}>
                {editingQuestion ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Confirm Delete */}
        {confirmDeleteId !== null && (
          <Modal 
            open={true} 
            title="Delete question?" 
            onClose={() => setConfirmDeleteId(null)}
          >
            <div className="space-y-4">
              <p className="text-gray-600">
                This action cannot be undone. The question will be removed from this interview.
              </p>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
                <Button 
                  onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </SimpleConnectionGuard>
  );
}

export default Questions;

