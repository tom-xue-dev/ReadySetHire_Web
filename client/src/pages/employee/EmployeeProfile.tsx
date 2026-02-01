import { useState, useEffect } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { apiConfig } from '@/config/apiConfig';
import LandingHeader from '@/components/layout/LandingHeader';
import LandingFooter from '@/components/layout/LandingFooter';
import { UserCircleIcon, DocumentArrowUpIcon, BriefcaseIcon, EyeIcon, XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface ProfileResume {
  id: number;
  originalName: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

interface UserProfile {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  profileResume?: ProfileResume | null;
}

export default function EmployeeProfile() {
  const { t } = useI18n();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedClassifications, setSelectedClassifications] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Resume preview state
  const [previewResume, setPreviewResume] = useState<{
    resumeId: number;
    fileName: string;
    blobUrl?: string;
    loading?: boolean;
    error?: string;
  } | null>(null);

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

  // Load user profile on mount
  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiConfig.baseUrl}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load profile');
      }

      const data = await response.json();
      setProfile(data);
    } catch (err) {
      console.error('Failed to load profile:', err);
      setMessage({ type: 'error', text: t('profile.loadError') });
    } finally {
      setLoading(false);
    }
  }

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      setMessage({ type: 'error', text: t('profile.resumeSection.uploadFormats') });
      return;
    }

    // Check file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setMessage({ type: 'error', text: t('profile.resumeSection.fileTooLarge') });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('resume', file);

      const response = await fetch(`${apiConfig.baseUrl}/auth/profile/resume`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      
      // Update profile with new resume
      setProfile(prev => prev ? {
        ...prev,
        profileResume: result.resume,
      } : null);

      setMessage({ type: 'success', text: t('profile.resumeSection.uploadSuccess') });
    } catch (error: any) {
      console.error('Resume upload failed:', error);
      setMessage({ type: 'error', text: error.message || t('profile.resumeSection.uploadError') });
    } finally {
      setUploading(false);
    }
  };

  // Load resume for preview
  async function loadResumePreview(resumeId: number, fileName: string) {
    setPreviewResume({
      resumeId,
      fileName,
      loading: true,
    });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiConfig.baseUrl}/resumes/${resumeId}/preview`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load resume: ${response.status}`);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      setPreviewResume({
        resumeId,
        fileName,
        blobUrl,
        loading: false,
      });
    } catch (err: any) {
      console.error('Failed to load resume preview:', err);
      setPreviewResume({
        resumeId,
        fileName,
        loading: false,
        error: err.message || 'Failed to load resume',
      });
    }
  }

  // Close preview and cleanup
  function closePreview() {
    if (previewResume?.blobUrl) {
      URL.revokeObjectURL(previewResume.blobUrl);
    }
    setPreviewResume(null);
  }

  // Download resume
  async function downloadResume(resumeId: number, fileName: string) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiConfig.baseUrl}/resumes/${resumeId}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download resume:', err);
      setMessage({ type: 'error', text: t('profile.resumeSection.downloadError') });
    }
  }

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

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }

  if (loading) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="text-gray-500">{t('forms.loading')}</div>
      </div>
    );
  }

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
                {/* Current Resume Display */}
                {profile?.profileResume && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">📄</span>
                        <div>
                          <div className="font-medium text-green-800">
                            {profile.profileResume.originalName}
                          </div>
                          <div className="text-sm text-green-600">
                            {formatFileSize(profile.profileResume.fileSize)} • 
                            {t('profile.resumeSection.uploadedOn')} {new Date(profile.profileResume.uploadedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => loadResumePreview(
                            profile.profileResume!.id,
                            profile.profileResume!.originalName
                          )}
                          className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                          title={t('profile.resumeSection.preview')}
                        >
                          <EyeIcon className="w-5 h-5 text-green-700" />
                        </button>
                        <button
                          onClick={() => downloadResume(
                            profile.profileResume!.id,
                            profile.profileResume!.originalName
                          )}
                          className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                          title={t('profile.resumeSection.download')}
                        >
                          <ArrowDownTrayIcon className="w-5 h-5 text-green-700" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Upload Area */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
                  <input
                    type="file"
                    id="resume-upload"
                    accept=".pdf,.docx"
                    onChange={handleResumeUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  <label
                    htmlFor="resume-upload"
                    className={`cursor-pointer flex flex-col items-center gap-3 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <DocumentArrowUpIcon className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {profile?.profileResume 
                          ? t('profile.resumeSection.uploadNew')
                          : t('profile.resumeSection.upload')
                        }
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {t('profile.resumeSection.uploadFormats')}
                      </div>
                    </div>
                  </label>
                </div>

                {uploading && (
                  <div className="text-center text-sm text-gray-500 flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {t('profile.resumeSection.uploading')}
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

      {/* Resume Preview Panel */}
      {previewResume && (
        <>
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={closePreview}
          />
          
          <div className="fixed top-0 right-0 h-full w-[50vw] max-w-3xl bg-white shadow-2xl z-50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{t('profile.resumeSection.previewTitle')}</h3>
                <p className="text-sm text-gray-500">{previewResume.fileName}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadResume(previewResume.resumeId, previewResume.fileName)}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  title={t('profile.resumeSection.download')}
                >
                  <ArrowDownTrayIcon className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={closePreview}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
            
            {/* PDF Viewer */}
            <div className="flex-1 overflow-hidden">
              {previewResume.loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-gray-500">{t('forms.loading')}</div>
                </div>
              ) : previewResume.error ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-red-500">{previewResume.error}</div>
                </div>
              ) : previewResume.blobUrl ? (
                <iframe
                  src={previewResume.blobUrl}
                  className="w-full h-full border-0"
                  title="Resume Preview"
                />
              ) : null}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
