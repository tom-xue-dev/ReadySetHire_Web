import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
// @ts-ignore JS helper
import { updateInterview, updateApplicantInterviewStatus } from "../api/helper.js";

export default function InterviewThanks() {
  const navigate = useNavigate();
  const { interviewId, applicantId } = useParams();

  useEffect(() => {
    async function finalize() {
      if (interviewId && applicantId) {
        try {
          await updateApplicantInterviewStatus(Number(applicantId), Number(interviewId), 'COMPLETED');
        } catch (e) {
          console.error('Failed to mark applicant interview as COMPLETED:', e);
        }
      }
      if (interviewId) {
        try {
          await updateInterview(Number(interviewId), { status: "ARCHIVED" });
        } catch (e) {
          // Non-blocking
          console.error("Failed to archive interview:", e);
        }
      }
    }
    finalize();
  }, [interviewId, applicantId]);

  return (
    <section className="min-h-screen grid place-items-center p-4 bg-gradient-to-b from-sky-50 to-white">
      <div className="w-full max-w-2xl bg-white border border-blue-100 rounded-2xl shadow-2xl shadow-sky-600/15 p-8 text-center">
        <div className="flex justify-center">
          <svg className="w-30 h-30 drop-shadow-lg drop-shadow-green-500/35" viewBox="0 0 120 120" aria-hidden>
            <circle cx="60" cy="60" r="56" fill="#22c55e" />
            <path d="M36 62 L54 78 L86 44" fill="none" stroke="#ffffff" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="mt-4 mb-1 text-3xl font-bold text-slate-900">Thank you for completing the Interview!</h1>
        <p className="mb-0 text-slate-600">We appreciate your time and effort.</p>
        <div className="flex gap-3 justify-center mt-5">
          <button 
            className="px-5 py-3 rounded-lg border border-blue-600 bg-blue-600 text-white font-semibold cursor-pointer shadow-lg shadow-blue-600/25 hover:bg-blue-700 hover:border-blue-700"
            onClick={() => navigate('/')}
          >
            Back to Home
          </button>
          {interviewId && (
            <button 
              className="px-5 py-3 rounded-lg border border-blue-200 bg-white text-blue-900 font-semibold cursor-pointer hover:bg-blue-50"
              onClick={() => navigate(`/interviews/${interviewId}/questions`)}
            >
              View Interview
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

