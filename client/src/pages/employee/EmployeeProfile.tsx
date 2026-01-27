import { useState } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import LandingHeader from '@/components/layout/LandingHeader';
import LandingFooter from '@/components/layout/LandingFooter';
import { UserCircleIcon, DocumentArrowUpIcon, BriefcaseIcon } from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function EmployeeProfile() {
  const { t } = useI18n();
  const [currentResume, setCurrentResume] = useState<string | null>(null);
  const [selectedClassifications, setSelectedClassifications] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const classifications = [
    'Software Development',
    'Data Science & Analytics',
    'Product Management',
    'Design & UX',
    'Marketing',
    'Sales',
    'Finance & Accounting',
    'Human Resources',
    'Operations',
    'Customer Support',
    'Engineering',
    'Healthcare',
    'Education',
    'Legal',
    'Other'
  ];

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      setMessage({ type: 'error', text: t('profile.resumeSection.uploadFormats') });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      // TODO: Implement actual upload to backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCurrentResume(file.name);
      setMessage({ type: 'success', text: t('profile.resumeSection.uploadSuccess') });
    } catch (error) {
      setMessage({ type: 'error', text: t('profile.resumeSection.uploadError') });
    } finally {
      setUploading(false);
    }
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    setMessage(null);

    try {
      // TODO: Implement actual save to backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage({ type: 'success', text: t('profile.preferencesSection.saveSuccess') });
    } catch (error) {
      setMessage({ type: 'error', text: t('profile.preferencesSection.saveError') });
    } finally {
      setSaving(false);
    }
  };

  const toggleClassification = (classification: string) => {
    setSelectedClassifications(prev =>
      prev.includes(classification)
        ? prev.filter(c => c !== classification)
        : [...prev, classification]
    );
  };

  return (
    <div className="bg-white min-h-screen relative flex flex-col">
      <LandingHeader showNavLinks={false} />
      
      {/* Top background decoration */}
      <div aria-hidden="true" className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-[80px] sm:-top-80">
        <div
          style={{clipPath:'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)'}}
          className="relative left-1/2 aspect-1155/678 w-400 -translate-x-1/2 rotate-30 bg-linear-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 blur-3xl pointer-events-none sm:w-560"
        />
      </div>

      <div className="min-h-screen bg-transparent pt-14">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 relative overflow-hidden shadow-lg">
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-3 mb-3">
                <UserCircleIcon className="w-10 h-10 text-white" />
                <h1 className="text-3xl font-bold text-white">{t('profile.title')}</h1>
              </div>
              <p className="text-white/90 text-lg">{t('profile.subtitle')}</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {message && (
            <div className={`mb-6 p-4 rounded-lg border ${
              message.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              {message.text}
            </div>
          )}

          <div className="space-y-6">
            {/* Resume Section */}
            <Card className="max-w-none p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <DocumentArrowUpIcon className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {t('profile.resumeSection.title')}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {t('profile.resumeSection.description')}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {currentResume && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-700">
                          {t('profile.resumeSection.current')}
                        </div>
                        <div className="text-sm text-gray-900 mt-1">{currentResume}</div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
                  <input
                    type="file"
                    id="resume-upload"
                    accept=".pdf,.docx"
                    onChange={handleResumeUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="resume-upload"
                    className="cursor-pointer flex flex-col items-center gap-3"
                  >
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <DocumentArrowUpIcon className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {t('profile.resumeSection.upload')}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {t('profile.resumeSection.uploadFormats')}
                      </div>
                    </div>
                  </label>
                </div>

                {uploading && (
                  <div className="text-center text-sm text-gray-500">
                    {t('forms.loading')}
                  </div>
                )}
              </div>
            </Card>

            {/* Job Preferences Section */}
            <Card className="max-w-none p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-indigo-100 rounded-lg">
                  <BriefcaseIcon className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {t('profile.preferencesSection.title')}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {t('profile.preferencesSection.description')}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    {t('profile.preferencesSection.classification')}
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {classifications.map((classification) => (
                      <button
                        key={classification}
                        onClick={() => toggleClassification(classification)}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                          selectedClassifications.includes(classification)
                            ? 'bg-indigo-50 border-indigo-600 text-indigo-700'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {classification}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button
                    onClick={handleSavePreferences}
                    disabled={saving || selectedClassifications.length === 0}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2"
                  >
                    {saving ? t('forms.loading') : t('profile.preferencesSection.save')}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
      
      <LandingFooter />
    </div>
  );
}
