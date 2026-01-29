import { useEffect, useMemo, useState } from 'react';
import {
  SparklesIcon,
  DocumentArrowUpIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  BookmarkIcon,
  BriefcaseIcon,
  UserIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  XCircleIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import LandingHeader from '@/components/layout/LandingHeader';
import LandingFooter from '@/components/layout/LandingFooter';
import { analyzeResume, getSavedJobs, type AnalysisResult as APIAnalysisResult } from '@/api/api';
import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/pages/auth/AuthContext';

type InputMethod = 'select' | 'paste' | 'upload';
type AnalysisTab = 'overview' | 'requirements' | 'skills' | 'interview';

interface JDInput {
  method: InputMethod;
  selectedJobId?: string;
  text: string;
  file?: File;
  level?: string;
  mustHaveWeight?: number;
  language?: string;
}

interface ResumeInput {
  method: Exclude<InputMethod, 'select'>;
  text: string;
  file?: File;
  anonymize: boolean;
  complianceCheck: boolean;
}

type AnalysisResult = APIAnalysisResult;

type SavedJobJob = {
  id: number;
  title: string;
  description: string;
  requirements?: string | null;
  location?: string | null;
  salaryRange?: string | null;
  status?: string;
};

type SavedJobEntry = {
  id: number;
  savedAt: string;
  job: SavedJobJob;
};

export default function RateResume() {
  const { t, language } = useI18n();
  const { user } = useAuth();
  
  const [jdInput, setJdInput] = useState<JDInput>({
    method: 'select',
    text: '',
    level: 'Mid',
    mustHaveWeight: 60,
    language: language === 'zh' ? '中文' : 'English',
  });

  
  
  const [resumeInput, setResumeInput] = useState<ResumeInput>({
    method: 'upload',
    text: '',
    anonymize: true,
    complianceCheck: true,
  });

  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<AnalysisTab>('overview');
  const [error, setError] = useState<string | null>(null);

  const [savedJobs, setSavedJobs] = useState<SavedJobEntry[]>([]);

  const savedJobsList: SavedJobJob[] = useMemo(() => {
    return savedJobs
      .map((s) => s.job)
      .filter((job): job is SavedJobJob => !!job && typeof job.id === 'number');
  }, [savedJobs]);

  useEffect(() => {
    async function loadSavedJobs() {
      if (!user?.id) return;
      try {
        const data = await getSavedJobs(Number(user.id));
        setSavedJobs((data as SavedJobEntry[]) || []);
      } catch (e) {
        console.error('Failed to load saved jobs:', e);
        setSavedJobs([]);
      }
    }
    loadSavedJobs();
  }, [user?.id]);

  const handleAnalyze = async () => {
    if (!jdInput.text || !resumeInput.text) {
      setError(t('rateResume.errors.missingInput'));
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      const result = await analyzeResume({
        jdText: jdInput.text,
        resumeText: resumeInput.text,
        settings: {
          level: jdInput.level,
          mustHaveWeight: jdInput.mustHaveWeight,
          language: jdInput.language,
          anonymize: resumeInput.anonymize,
        },
      });

      setAnalysisResult(result);
      setActiveTab('overview');
    } catch (err) {
      console.error('分析失败:', err);
      setError(err instanceof Error ? err.message : '分析失败，请重试');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReset = () => {
    setJdInput({
      method: 'select',
      text: '',
      level: 'Mid',
      mustHaveWeight: 60,
      language: '中文',
    });
    setResumeInput({
      method: 'upload',
      text: '',
      anonymize: true,
      complianceCheck: true,
    });
    setAnalysisResult(null);
  };

  const getConclusionLabel = (conclusion: string) => {
    const key = conclusion.toLowerCase().replace(/_/g, '');
    const translationKey = `rateResume.analysis.conclusion.${key}`;
    return t(translationKey);
  };

  const getConclusionColor = (conclusion: string) => {
    const colors: Record<string, string> = {
      STRONG_HIRE: 'text-green-700 bg-green-50',
      HIRE: 'text-blue-700 bg-blue-50',
      LEAN_HIRE: 'text-yellow-700 bg-yellow-50',
      LEAN_NO: 'text-orange-700 bg-orange-50',
      NO: 'text-red-700 bg-red-50',
    };
    return colors[conclusion] || 'text-gray-700 bg-gray-50';
  };

  return (
    <div className="bg-white min-h-screen relative flex flex-col">
      <LandingHeader showNavLinks={false} />
      
      {/* Top background decoration - same as TrackingJobs */}
      <div aria-hidden="true" className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-[80px] sm:-top-80">
        <div
          style={{clipPath:'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)'}}
          className="relative left-1/2 aspect-1155/678 w-400 -translate-x-1/2 rotate-30 bg-linear-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 blur-3xl pointer-events-none sm:w-560"
        />
      </div>

      <div className="min-h-screen bg-transparent pt-14">
        {/* Header Section */}
        <div className="bg-linear-to-r from-purple-600 via-indigo-600 to-pink-600 relative overflow-hidden shadow-lg">
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-3 mb-3">
                <SparklesIcon className="w-10 h-10 text-white" />
                <h1 className="text-3xl font-bold text-white">{t('rateResume.title')}</h1>
              </div>
              <p className="text-white/90 text-lg">{t('rateResume.subtitle')}</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 顶部任务栏（Sticky） */}
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 py-3 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                onClick={handleAnalyze}
                disabled={analyzing || !jdInput.text || !resumeInput.text}
                className="flex items-center gap-2 bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <SparklesIcon className="w-4 h-4" />
                {analyzing ? t('rateResume.analyzing') : t('rateResume.analyzeButton')}
              </Button>
              <Button
                type="button"
                onClick={() => alert(t('rateResume.savingFeature'))}
                className="flex items-center gap-2 bg-white text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50"
              >
                <BookmarkIcon className="w-4 h-4" />
                {t('rateResume.saveReport')}
              </Button>
              <Button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-2 bg-white text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50"
              >
                <ArrowPathIcon className="w-4 h-4" />
                {t('rateResume.reset')}
              </Button>
            </div>
            <div className="text-xs text-gray-500">
              {t('rateResume.model')}：<span className="font-mono">ollama/deepseek-r1:7b</span> | {t('rateResume.expectedOutput')}：{t('rateResume.structuredReport')}
            </div>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* 左右双栏布局 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* 左栏：JD 输入区 */}
          <Card className="max-w-none p-6">
            <div className="flex items-center gap-2 mb-4">
              <BriefcaseIcon className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">{t('rateResume.jd.title')}</h2>
            </div>

            {/* Tab 切换 */}
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setJdInput({ ...jdInput, method: 'select' })}
                className={`px-3 py-1.5 text-sm rounded-lg ${
                  jdInput.method === 'select'
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t('rateResume.jd.selectJob')}
              </button>
              <button
                type="button"
                onClick={() => setJdInput({ ...jdInput, method: 'paste' })}
                className={`px-3 py-1.5 text-sm rounded-lg ${
                  jdInput.method === 'paste'
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t('rateResume.jd.pasteText')}
              </button>
              <button
                type="button"
                onClick={() => setJdInput({ ...jdInput, method: 'upload' })}
                className={`px-3 py-1.5 text-sm rounded-lg ${
                  jdInput.method === 'upload'
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t('rateResume.jd.uploadFile')}
              </button>
            </div>

            {/* 输入区域 */}
            {jdInput.method === 'select' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('rateResume.jd.selectJob')}</label>
                <select
                  value={jdInput.selectedJobId || ''}
                  onChange={(e) => {
                    const selectedJobId = e.target.value;
                    const selectedJob = savedJobsList.find((job) => String(job.id) === selectedJobId);
                    setJdInput({
                      ...jdInput,
                      selectedJobId,
                      text: selectedJob?.description || '',
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">{t('rateResume.jd.selectPlaceholder')}</option>
                  {savedJobsList.map((job) => (
                    <option key={job.id} value={String(job.id)}>{job.title}</option>
                  ))}
                </select>
              </div>
            )}

            {jdInput.method === 'paste' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('rateResume.jd.title')}</label>
                <textarea
                  value={jdInput.text}
                  onChange={(e) => setJdInput({ ...jdInput, text: e.target.value })}
                  placeholder={t('rateResume.jd.textPlaceholder')}
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            )}

            {jdInput.method === 'upload' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('rateResume.jd.uploadFile')}</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <DocumentArrowUpIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-2">{t('rateResume.jd.uploadPrompt')}</p>
                  <p className="text-xs text-gray-500">{t('rateResume.jd.uploadFormats')}</p>
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setJdInput({ ...jdInput, file: e.target.files[0] });
                      }
                    }}
                    className="hidden"
                    id="jd-file-upload"
                  />
                  <label htmlFor="jd-file-upload" className="cursor-pointer">
                    <Button type="button" className="mt-3 text-sm">
                      {t('rateResume.jd.selectFile')}
                    </Button>
                  </label>
                </div>
                {jdInput.file && (
                  <div className="mt-2 text-sm text-gray-600 flex items-center gap-2">
                    <DocumentTextIcon className="w-4 h-4" />
                    {jdInput.file.name}
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* 右栏：简历输入区 */}
          <Card className="max-w-none p-6">
            <div className="flex items-center gap-2 mb-4">
              <UserIcon className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">{t('rateResume.resume.title')}</h2>
            </div>

            {/* Tab 切换 */}
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setResumeInput({ ...resumeInput, method: 'upload' })}
                className={`px-3 py-1.5 text-sm rounded-lg ${
                  resumeInput.method === 'upload'
                    ? 'bg-green-100 text-green-700 font-medium'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t('rateResume.resume.upload')}
              </button>
              <button
                type="button"
                onClick={() => setResumeInput({ ...resumeInput, method: 'paste' })}
                className={`px-3 py-1.5 text-sm rounded-lg ${
                  resumeInput.method === 'paste'
                    ? 'bg-green-100 text-green-700 font-medium'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t('rateResume.resume.paste')}
              </button>
            </div>

            {/* 输入区域 */}
            {resumeInput.method === 'upload' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('rateResume.resume.upload')}</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors">
                  <DocumentArrowUpIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-2">{t('rateResume.resume.uploadPrompt')}</p>
                  <p className="text-xs text-gray-500">{t('rateResume.resume.uploadFormats')}</p>
                  <input
                    type="file"
                    accept=".pdf,.docx"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setResumeInput({ ...resumeInput, file: e.target.files[0] });
                      }
                    }}
                    className="hidden"
                    id="resume-file-upload"
                  />
                  <label htmlFor="resume-file-upload" className="cursor-pointer">
                    <Button type="button" className="mt-3 text-sm">
                      {t('rateResume.jd.selectFile')}
                    </Button>
                  </label>
                </div>
                {resumeInput.file && (
                  <div className="mt-2 text-sm text-gray-600 flex items-center gap-2">
                    <DocumentTextIcon className="w-4 h-4" />
                    {resumeInput.file.name}
                  </div>
                )}
              </div>
            )}

            {resumeInput.method === 'paste' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('rateResume.resume.title')}</label>
                <textarea
                  value={resumeInput.text}
                  onChange={(e) => setResumeInput({ ...resumeInput, text: e.target.value })}
                  placeholder={t('rateResume.resume.textPlaceholder')}
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                />
              </div>
            )}

            {/* 隐私选项 */}
            <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={resumeInput.anonymize}
                  onChange={(e) => setResumeInput({ ...resumeInput, anonymize: e.target.checked })}
                  className="rounded text-green-600"
                />
                <span className="text-gray-700">{t('rateResume.resume.anonymize')}</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={resumeInput.complianceCheck}
                  onChange={(e) => setResumeInput({ ...resumeInput, complianceCheck: e.target.checked })}
                  className="rounded text-green-600"
                />
                <span className="text-gray-700">{t('rateResume.resume.compliance')}</span>
              </label>
            </div>
          </Card>
        </div>

        {/* 底部：分析结果区 */}
        {analysisResult && (
          <div className="mt-6">
            <Card className="max-w-none p-6">
              <div className="flex items-center gap-2 mb-4">
                <ChartBarIcon className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-semibold text-gray-900">{t('rateResume.analysis.title')}</h2>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-6 border-b border-gray-200">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'overview'
                      ? 'border-purple-600 text-purple-700'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {t('rateResume.analysis.tabOverview')}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('requirements')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'requirements'
                      ? 'border-purple-600 text-purple-700'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {t('rateResume.analysis.tabRequirements')}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('skills')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'skills'
                      ? 'border-purple-600 text-purple-700'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {t('rateResume.analysis.tabSkills')}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('interview')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'interview'
                      ? 'border-purple-600 text-purple-700'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {t('rateResume.analysis.tabInterview')}
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* 匹配分数 */}
                  <div className="flex items-center gap-6">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">{t('rateResume.analysis.matchScore')}</span>
                        <span className="text-2xl font-bold text-purple-700">{analysisResult.score}</span>
                      </div>
                      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-purple-500 to-blue-500 transition-all duration-500"
                          style={{ width: `${analysisResult.score}%` }}
                        />
                      </div>
                    </div>
                    <div
                      className={`px-4 py-2 rounded-lg font-medium text-sm ${getConclusionColor(
                        analysisResult.conclusion
                      )}`}
                    >
                      {getConclusionLabel(analysisResult.conclusion)}
                    </div>
                  </div>

                  {/* 最强证据 */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <CheckCircleIcon className="w-5 h-5 text-green-600" />
                      {t('rateResume.analysis.topStrengths')}
                    </h3>
                    <div className="space-y-2">
                      {analysisResult.topStrengths.map((strength, idx) => (
                        <div key={idx} className="p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="text-sm font-medium text-gray-900">{strength.point}</div>
                          <div className="text-xs text-gray-600 mt-1">{strength.evidence}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 最大缺口 */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <ExclamationCircleIcon className="w-5 h-5 text-orange-600" />
                      {t('rateResume.analysis.topGaps')}
                    </h3>
                    <div className="space-y-2">
                      {analysisResult.topGaps.map((gap, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg border ${
                            gap.severity === 'high'
                              ? 'bg-red-50 border-red-200'
                              : gap.severity === 'medium'
                              ? 'bg-orange-50 border-orange-200'
                              : 'bg-yellow-50 border-yellow-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 text-xs font-medium rounded ${
                                gap.severity === 'high'
                                  ? 'bg-red-200 text-red-800'
                                  : gap.severity === 'medium'
                                  ? 'bg-orange-200 text-orange-800'
                                  : 'bg-yellow-200 text-yellow-800'
                              }`}
                            >
                              {gap.severity === 'high' ? t('rateResume.analysis.severityHigh') : gap.severity === 'medium' ? t('rateResume.analysis.severityMedium') : t('rateResume.analysis.severityLow')}
                            </span>
                            <span className="text-sm text-gray-900">{gap.gap}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 风险提醒 */}
                  {analysisResult.risks.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <XCircleIcon className="w-5 h-5 text-red-600" />
                        {t('rateResume.analysis.risks')}
                      </h3>
                      <div className="space-y-1">
                        {analysisResult.risks.map((risk, idx) => (
                          <div key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-red-500 mt-0.5">•</span>
                            {risk}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'requirements' && (
                <div className="space-y-3">
                  {analysisResult.hardRequirements.map((req, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border ${
                        req.status === 'pass'
                          ? 'bg-green-50 border-green-200'
                          : req.status === 'warning'
                          ? 'bg-yellow-50 border-yellow-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {req.status === 'pass' ? (
                          <CheckCircleIcon className="w-5 h-5 text-green-600" />
                        ) : req.status === 'warning' ? (
                          <ExclamationCircleIcon className="w-5 h-5 text-yellow-600" />
                        ) : (
                          <XCircleIcon className="w-5 h-5 text-red-600" />
                        )}
                        <span className="text-sm font-medium text-gray-900">{req.requirement}</span>
                      </div>
                      <div className="text-xs text-gray-600 ml-7">{req.evidence}</div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'skills' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 font-semibold text-gray-900">{t('rateResume.analysis.skill')}</th>
                        <th className="text-left py-2 px-3 font-semibold text-gray-900">{t('rateResume.analysis.candidateEvidence')}</th>
                        <th className="text-left py-2 px-3 font-semibold text-gray-900">{t('rateResume.analysis.matchLevel')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysisResult.skillsMatrix.map((item, idx) => (
                        <tr key={idx} className="border-b border-gray-100">
                          <td className="py-3 px-3 font-medium text-gray-900">{item.skill}</td>
                          <td className="py-3 px-3 text-gray-600">{item.candidateEvidence}</td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${
                                    item.match >= 80
                                      ? 'bg-green-500'
                                      : item.match >= 60
                                      ? 'bg-yellow-500'
                                      : 'bg-red-500'
                                  }`}
                                  style={{ width: `${item.match}%` }}
                                />
                              </div>
                              <span
                                className={`text-xs font-medium ${
                                  item.match >= 80
                                    ? 'text-green-700'
                                    : item.match >= 60
                                    ? 'text-yellow-700'
                                    : 'text-red-700'
                                }`}
                              >
                                {item.match}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'interview' && (
                <div className="space-y-4">
                  {analysisResult.interviewQuestions.map((q, idx) => (
                    <div key={idx} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-start gap-2 mb-2">
                        <QuestionMarkCircleIcon className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 mb-1">{q.question}</div>
                          <div className="text-xs text-gray-600 mb-2">
                            <span className="font-medium">{t('rateResume.analysis.questionPurpose')}：</span>
                            {q.purpose}
                          </div>
                          <div className="text-xs text-gray-600">
                            <span className="font-medium">{t('rateResume.analysis.expectedAnswer')}：</span>
                            {q.goodAnswer}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}
        </div>
      </div>
      
      <LandingFooter />
    </div>
  );
}
