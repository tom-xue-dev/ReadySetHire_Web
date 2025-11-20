import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
// @ts-ignore JS helper
import { getInterview, getApplicantsByInterview } from "../api/helper.js";

type Interview = { id: number; title?: string };
type Applicant = {
  id: number;
  firstname?: string;
  surname?: string;
  emailAddress?: string;
  phone_number?: string;
};

export default function InterviewWelcome() {
  const { interviewId: interviewIdParam, applicantId: applicantIdParam } = useParams();
  const interviewId = Number(interviewIdParam);
  const applicantId = Number(applicantIdParam);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interview, setInterview] = useState<Interview | null>(null);
  const [applicant, setApplicant] = useState<Applicant | null>(null);

  useEffect(() => {
    async function load() {
      if (!interviewId || !applicantId) return;
      setLoading(true);
      setError(null);
      try {
        const [ivRaw, applicants] = await Promise.all([
          getInterview(interviewId),
          getApplicantsByInterview(interviewId),
        ]);
        const iv = Array.isArray(ivRaw) ? (ivRaw[0] ?? null) : ivRaw;
        setInterview(iv);
        const list: Applicant[] = Array.isArray(applicants) ? applicants : [];
        const app = list.find(a => Number(a.id) === applicantId) ?? null;
        setApplicant(app);
      } catch (e: any) {
        setError(e?.message ?? 'Load failed');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [interviewId, applicantId]);

  return (
    <section className="min-h-[40vh] grid place-items-center p-4">
      <div className="w-full max-w-2xl bg-white border border-blue-200 rounded-xl shadow-lg shadow-blue-800/15 p-8">
        <h1 className="text-3xl font-bold text-blue-700 text-center mb-2">Welcome to Your Interview</h1>
        <p className="text-center text-blue-800/80 mb-5">Please review your details before starting.</p>

        {error && <div className="mt-3 p-2 text-center text-red-700 bg-red-50 border border-red-200 rounded-lg">{error}</div>}
        {loading ? (
          <div className="w-8 h-8 border-3 border-blue-300 border-t-blue-600 rounded-full animate-spin mx-auto mt-6" />
        ) : (
          <div className="mt-5 grid justify-items-center">
            <div className="text-xs uppercase tracking-wider text-blue-500">Name</div>
            <div className="mt-1 mb-2 text-lg font-semibold text-slate-900">{applicant ? `${applicant.firstname ?? ''} ${applicant.surname ?? ''}`.trim() : '-'}</div>
            <div className="text-xs uppercase tracking-wider text-blue-500">Email</div>
            <div className="mt-1 mb-2 text-lg font-semibold text-slate-900">{applicant?.emailAddress ?? '-'}</div>
            <div className="text-xs uppercase tracking-wider text-blue-500">Interview</div>
            <div className="mt-1 mb-2 text-lg font-semibold text-slate-900">{interview?.title ?? `Interview #${interviewId}`}</div>

            <div className="flex justify-center mt-6">
              <button 
                className="inline-flex items-center justify-center px-6 py-3 font-semibold text-white bg-blue-600 border border-blue-600 rounded-lg cursor-pointer shadow-lg shadow-blue-600/35 transition-all duration-150 hover:bg-blue-700 hover:border-blue-700 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-700/35 active:translate-y-0 active:shadow-lg active:shadow-blue-700/35"
                onClick={() => navigate(`/interview-run/${interviewId}/${applicantId}`)}
              >
                Start Interview
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
