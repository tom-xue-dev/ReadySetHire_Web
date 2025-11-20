import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
// @ts-ignore JS helper
import { getQuestions, getInterview, getAnswersByApplicant, createApplicantAnswer, updateApplicantAnswer } from "../api/helper.js";
import EnhancedAudioCapture from "../components/EnhancedAudioCapture";
import { transcribeWavBlob, createFallbackTranscription, isASRAvailable, resetASRAvailability } from "../api/asr";
import { useAuth } from "@/pages/auth/AuthContext";

type Question = { id: number; question: string; difficulty?: string };

export default function InterviewRun() {
  const { interviewId: interviewIdParam, applicantId: applicantIdParam } = useParams();
  const interviewId = Number(interviewIdParam);
  const applicantId = Number(applicantIdParam);
  const navigate = useNavigate();
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [answerIds, setAnswerIds] = useState<Record<number, number>>({});
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const [recordingCount, setRecordingCount] = useState<Record<number, number>>({});
  const [asrError, setAsrError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!interviewId) return;
      setLoading(true);
      setError(null);
      try {
        const [qs, ivRaw, existing] = await Promise.all([
          getQuestions(interviewId),
          getInterview(interviewId),
          applicantId ? getAnswersByApplicant(applicantId) : Promise.resolve([]),
        ]);
        const list: Question[] = (Array.isArray(qs) ? qs : [])
          .map((q: any) => ({ id: Number(q.id), question: String(q.question ?? ''), difficulty: q.difficulty }))
          .sort((a, b) => a.id - b.id);
        setQuestions(list);
        const iv = Array.isArray(ivRaw) ? ivRaw[0] : ivRaw;
        setTitle(iv?.title ?? `Interview #${interviewId}`);
        setIndex(0);
        // Pre-fill answers if they exist for this applicant
        const ansMap: Record<number, string> = {};
        const idMap: Record<number, number> = {};
        if (Array.isArray(existing)) {
          for (const a of existing as any[]) {
            const qid = Number(a.question_id);
            if (qid) {
              ansMap[qid] = String(a.answer ?? '');
              if (a.id) idMap[qid] = Number(a.id);
            }
          }
        }
        setAnswers(ansMap);
        setAnswerIds(idMap);
      } catch (e: any) {
        setError(e?.message ?? 'Load failed');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [interviewId]);

  const current = useMemo(() => questions[index], [questions, index]);
  const progress = questions.length ? Math.min(index + 1, questions.length) / questions.length : 0;

  function handleChange(val: string) {
    if (!current) return;
    setAnswers((prev) => ({ ...prev, [current.id]: val }));
  }

  async function handleAudioStop(blob: Blob) {
    if (!current) return;
    setTranscribing(true);
    setSaveErr(null);
    setAsrError(null);
    
    try {
      let text: string;
      
      // Try ASR first, fallback to manual input if it fails
      if (isASRAvailable()) {
        try {
          text = await transcribeWavBlob(blob, token || undefined);
        } catch (asrError: any) {
          console.warn('ASR failed, using fallback:', asrError.message);
          text = await createFallbackTranscription(blob);
          setAsrError(asrError.message);
          setSaveErr(`Speech recognition failed: ${asrError.message}. Please type your answer manually or try again.`);
        }
      } else {
        text = await createFallbackTranscription(blob);
        setAsrError('ASR not available');
        setSaveErr('Speech recognition is not available. Please type your answer manually.');
      }
      
      // Append to existing answer instead of replacing
      setAnswers((prev) => {
        const currentAnswer = prev[current.id] || '';
        const separator = currentAnswer.trim() ? ' ' : '';
        return { ...prev, [current.id]: currentAnswer + separator + text };
      });
      
      // Update recording count
      setRecordingCount((prev) => ({
        ...prev,
        [current.id]: (prev[current.id] || 0) + 1
      }));
    } catch (e: any) {
      setSaveErr(e?.message ?? "Transcription failed");
      setAsrError(e?.message ?? "Unknown error");
    } finally {
      setTranscribing(false);
    }
  }

  function handleRetryASR() {
    console.log('🔄 Retrying ASR initialization...');
    resetASRAvailability();
    setAsrError(null);
    setSaveErr(null);
  }

  async function saveCurrentIfNeeded() {
    setSaveErr(null);
    const q = current;
    if (!q || !applicantId || !interviewId) return;
    const val = answers[q.id] ?? '';
    try {
      setSaving(true);
      const existingId = answerIds[q.id];
      if (existingId) {
        await updateApplicantAnswer(existingId, { answer: val });
      } else {
        const created = await createApplicantAnswer({
          interview_id: interviewId,
          question_id: q.id,
          applicant_id: applicantId,
          answer: val,
        });
        const rec = Array.isArray(created) ? created[0] : created;
        if (rec?.id) setAnswerIds((m) => ({ ...m, [q.id]: Number(rec.id) }));
      }
    } catch (e: any) {
      setSaveErr(e?.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleNext() {
    await saveCurrentIfNeeded();
    if (index < questions.length - 1) setIndex((i) => i + 1);
  }

  function handleFinish() {
    // Save last answer then navigate
    saveCurrentIfNeeded().finally(() => {
      navigate(`/interview-thanks/${interviewId}/${applicantId}`);
    });
  }

  return (
    <section className="min-h-screen grid place-items-center p-4 bg-gradient-to-b from-indigo-50 to-white">
      <div className="w-full max-w-4xl bg-white border border-blue-100 rounded-2xl shadow-xl shadow-blue-700/12 p-6">
        <div className="text-center mb-4">
          <div className="text-xl font-bold text-blue-700">{title}</div>
          <div className="text-sm text-blue-600 opacity-85">Applicant ID: {applicantId || '-'}</div>
        </div>

        {error && <div className="mt-2 mb-2 text-center text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">{error}</div>}
        {loading ? (
          <div className="w-9 h-9 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto my-6" />
        ) : questions.length === 0 ? (
          <div className="text-center text-slate-600 py-4">No questions for this interview.</div>
        ) : (
          <>
            <div className="h-2 bg-indigo-50 rounded-full overflow-hidden my-4">
              <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-300" style={{ width: `${progress * 100}%` }} />
            </div>
            <div className="text-center text-sm text-blue-800 mb-2">Question {index + 1} of {questions.length}</div>

            <div className="text-lg leading-relaxed text-slate-900 bg-slate-50 border border-slate-200 rounded-lg p-4 mb-3">
              {current?.question}
            </div>

            <div className="grid gap-3">
              <EnhancedAudioCapture 
                onStop={handleAudioStop} 
                disabled={false}
                allowMultiple={true}
              />
              <textarea
                className="w-full min-h-[140px] p-3 rounded-lg border border-indigo-200 outline-none resize-y text-base focus:shadow-lg focus:shadow-blue-600/20 focus:border-blue-600"
                placeholder="Type your answer here or use voice recording..."
                value={current ? (answers[current.id] ?? '') : ''}
                onChange={(e) => handleChange(e.target.value)}
              />
              {transcribing && <div className="text-center text-blue-600 font-medium">Transcribing...</div>}
              {asrError && (
                <div className="text-red-700 text-sm p-2 bg-red-50 border border-red-200 rounded-lg mt-2">
                  <div className="font-bold mb-1">
                    ⚠️ Speech Recognition Error
                  </div>
                  <div className="mb-2">
                    {asrError}
                  </div>
                  <button 
                    onClick={handleRetryASR}
                    className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white border-none rounded cursor-pointer"
                  >
                    🔄 Retry Speech Recognition
                  </button>
                </div>
              )}
              {recordingCount[current?.id ?? -1] > 0 && (
                <div className="text-emerald-800 text-sm">
                  Recordings: {recordingCount[current?.id ?? -1]} (can record more)
                </div>
              )}
            </div>

            <div className="flex justify-between mt-4">
              {index < questions.length - 1 ? (
                <button 
                  className="px-5 py-3 rounded-lg border border-blue-600 bg-blue-600 text-white font-semibold cursor-pointer shadow-lg shadow-blue-600/30 hover:bg-blue-700 hover:border-blue-700"
                  onClick={handleNext}
                >
                  Next
                </button>
              ) : (
                <button 
                  className="px-5 py-3 rounded-lg border border-blue-600 bg-blue-600 text-white font-semibold cursor-pointer shadow-lg shadow-blue-600/30 hover:bg-blue-700 hover:border-blue-700"
                  onClick={handleFinish}
                >
                  Finish
                </button>
              )}
            </div>
            {saving && <div className="text-center text-blue-600 font-medium mt-2">Saving...</div>}
            {saveErr && <div className="mt-2 text-center text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">{saveErr}</div>}
          </>
        )}
      </div>
    </section>
  );
}
