import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
// @ts-ignore JS helper
import { getQuestions, getInterview, getAnswersByInterviewAndApplicant } from "../api/helper.js";

type QA = { id: number; question: string; answer: string };

export default function InterviewAnswers() {
  const { interviewId: interviewIdParam, applicantId: applicantIdParam } = useParams();
  const interviewId = Number(interviewIdParam);
  const applicantId = Number(applicantIdParam);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState<string>("");
  const [qas, setQas] = useState<QA[]>([]);

  useEffect(() => {
    async function load() {
      if (!interviewId || !applicantId) return;
      setLoading(true);
      setError(null);
      try {
        const [qs, ivRaw, answers] = await Promise.all([
          getQuestions(interviewId),
          getInterview(interviewId),
          getAnswersByInterviewAndApplicant(interviewId, applicantId),
        ]);
        
        console.log('🔍 Debug - Raw API responses:');
        console.log('Questions (qs):', qs);
        console.log('Interview (ivRaw):', ivRaw);
        console.log('Answers:', answers);
        
        // Extract questions data - handle both wrapped and unwrapped responses
        let questionsList = qs;
        if (qs && typeof qs === 'object' && 'data' in qs) {
          questionsList = qs.data;
        }
        
        // Extract interview data
        let interview = ivRaw;
        if (ivRaw && typeof ivRaw === 'object' && 'data' in ivRaw) {
          interview = Array.isArray(ivRaw.data) ? ivRaw.data[0] : ivRaw.data;
        } else {
          interview = Array.isArray(ivRaw) ? ivRaw[0] : ivRaw;
        }
        
        // Extract answers data
        let answersList = answers;
        if (answers && typeof answers === 'object' && 'data' in answers) {
          answersList = answers.data;
        }
        
        console.log('🔍 Processed data:');
        console.log('Questions list:', questionsList);
        console.log('Interview:', interview);
        console.log('Answers list:', answersList);
        
        setTitle(interview?.title ?? `Interview #${interviewId}`);
        
        // Create question map
        const qMap = new Map<number, string>();
        (Array.isArray(questionsList) ? questionsList : []).forEach((q: any) => {
          const questionId = Number(q.id);
          if (!isNaN(questionId) && questionId > 0) {
            qMap.set(questionId, String(q.question ?? ''));
            console.log(`📝 Mapped question ${questionId}: "${q.question}"`);
          } else {
            console.warn('⚠️ Invalid question ID:', q.id, 'in question:', q);
          }
        });
        
        // Create QA list
        const list: QA[] = (Array.isArray(answersList) ? answersList : [])
          .map((a: any) => {
            const questionId = Number(a.question_id || a.questionId);
            if (isNaN(questionId) || questionId <= 0) {
              console.warn('⚠️ Invalid question_id in answer:', a);
              return null;
            }
            const qa = {
              id: questionId,
              question: qMap.get(questionId) || `Question ${questionId}`,
              answer: String(a.answer ?? '')
            };
            console.log(`💬 Created QA:`, qa);
            return qa;
          })
          .filter((qa): qa is QA => qa !== null)
          .sort((a, b) => a.id - b.id);
          
        console.log('📋 Final QA list:', list);
        setQas(list);
      } catch (e: any) {
        setError(e?.message ?? 'Load failed');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [interviewId, applicantId]);

  return (
    <section className="max-w-3xl mx-auto p-4">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600 }}>{title} · Answers</h1>
        <button onClick={() => navigate(-1)} style={{ border: '1px solid #d1d5db', padding: '6px 10px', borderRadius: 8 }}>Back</button>
      </div>
      {error && <div style={{ color: '#dc2626', marginBottom: 8 }}>Error: {error}</div>}
      {loading ? (
        <div>Loading…</div>
      ) : qas.length === 0 ? (
        <div>No answers.</div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {qas.map((qa, index) => (
            <div key={`answer-${qa.id || index}`} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 12, background: 'white' }}>
              <div style={{ fontSize: 14, color: '#4b5563', marginBottom: 6 }}>Q{qa.id}</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{qa.question}</div>
              <div style={{ whiteSpace: 'pre-wrap' }}>{qa.answer || <span style={{ color: '#9ca3af' }}>No answer</span>}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}


