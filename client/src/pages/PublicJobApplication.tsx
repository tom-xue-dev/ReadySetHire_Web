import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { apiRequest } from '@/api/api';
import { useI18n } from '@/contexts/I18nContext';

interface Job {
  id: number;
  title: string;
  description: string;
  requirements?: string;
  location?: string;
  salaryRange?: string;
  publishedAt: string;
}

interface ProfileResume {
  id: number;
  originalName: string;
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

interface ApplicationForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  coverLetter: string;
  linkedinUrl: string;
  portfolioUrl: string;
  yearsExperience: string;
  resume: File | null;
}

type ResumeSource = 'profile' | 'upload';

export default function PublicJobApplication() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { t } = useI18n();
  
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [trackingToken, setTrackingToken] = useState<string>('');
  const [error, setError] = useState<string>('');
  
  // User profile with resume
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [resumeSource, setResumeSource] = useState<ResumeSource>('upload');
  
  const [form, setForm] = useState<ApplicationForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    coverLetter: '',
    linkedinUrl: '',
    portfolioUrl: '',
    yearsExperience: '',
    resume: null,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Fetch user profile if authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserProfile();
    }
  }, [isAuthenticated, user]);

  // Pre-fill form when profile is loaded
  useEffect(() => {
    if (userProfile) {
      setForm(prev => ({
        ...prev,
        firstName: userProfile.firstName || prev.firstName,
        lastName: userProfile.lastName || prev.lastName,
        email: userProfile.email || prev.email,
        phone: userProfile.phone || prev.phone,
      }));
      
      // If user has a profile resume, default to using it
      if (userProfile.profileResume) {
        setResumeSource('profile');
      }
    }
  }, [userProfile]);

  useEffect(() => {
    if (jobId) {
      fetchJob();
    }
  }, [jobId]);

  const fetchUserProfile = async () => {
    try {
      const response = await apiRequest('/auth/profile');
      if (response && typeof response === 'object') {
        setUserProfile(response as unknown as UserProfile);
      }
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
    }
  };

  const fetchJob = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/jobs/${jobId}`
      );
      
      if (!response.ok) {
        throw new Error('Job not found');
      }
      
      const data = await response.json();
      setJob(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      
      if (!allowedTypes.includes(file.type)) {
        setFormErrors(prev => ({
          ...prev,
          resume: 'Only PDF and DOC/DOCX files are allowed'
        }));
        return;
      }
      
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setFormErrors(prev => ({
          ...prev,
          resume: 'File size must be less than 10MB'
        }));
        return;
      }
    }
    
    setForm(prev => ({ ...prev, resume: file }));
    setFormErrors(prev => ({ ...prev, resume: '' }));
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!form.firstName.trim()) {
      errors.firstName = t('jobApplication.validation.firstNameRequired');
    }

    if (!form.lastName.trim()) {
      errors.lastName = t('jobApplication.validation.lastNameRequired');
    }

    if (!form.email.trim()) {
      errors.email = t('jobApplication.validation.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = t('jobApplication.validation.emailInvalid');
    }

    // Resume validation: either upload a file or use profile resume
    if (resumeSource === 'upload' && !form.resume) {
      errors.resume = t('jobApplication.validation.resumeRequired');
    }
    if (resumeSource === 'profile' && !userProfile?.profileResume) {
      errors.resume = t('jobApplication.validation.noProfileResume');
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('firstName', form.firstName);
      formData.append('lastName', form.lastName);
      formData.append('email', form.email);
      formData.append('phone', form.phone);
      formData.append('coverLetter', form.coverLetter);
      formData.append('linkedinUrl', form.linkedinUrl);
      formData.append('portfolioUrl', form.portfolioUrl);
      formData.append('yearsExperience', form.yearsExperience);
      
      // Handle resume: either use profile resume ID or upload new file
      if (resumeSource === 'profile' && userProfile?.profileResume) {
        formData.append('resumeId', String(userProfile.profileResume.id));
      } else if (form.resume) {
        formData.append('resume', form.resume);
      }

      // Include auth token if logged in
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/jobs/${jobId}/apply`,
        {
          method: 'POST',
          body: formData,
          headers,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('jobApplication.errors.submitFailed'));
      }

      const result = await response.json();
      setTrackingToken(result.trackingToken);
      setSubmitted(true);

    } catch (err: any) {
      setError(err.message || t('jobApplication.errors.submitFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading job details...</div>
      </div>
    );
  }

  if (error && !job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md">
          <div className="text-red-600 text-xl font-semibold mb-4">❌ Error</div>
          <p className="text-gray-700">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
          <div className="text-center">
            <div className="text-6xl mb-6">✅</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Application Submitted Successfully!
            </h2>
            <p className="text-gray-600 mb-6">
              Thank you for applying to <strong>{job?.title}</strong>
            </p>
            
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
              <p className="text-sm text-gray-600 mb-2">Your tracking number:</p>
              <p className="text-2xl font-mono font-bold text-blue-600 break-all">
                {trackingToken}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Save this number to track your application status
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => navigate(`/track/${trackingToken}`)}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 font-semibold transition"
              >
                Track Application Status
              </button>
              <button
                onClick={() => navigate('/jobs')}
                className="w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-300 font-semibold transition"
              >
                Browse More Jobs
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Job Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">{job?.title}</h1>
          <div className="flex flex-wrap gap-4 text-gray-600 mb-6">
            {job?.location && (
              <span className="flex items-center gap-2">
                📍 {job.location}
              </span>
            )}
            {job?.salaryRange && (
              <span className="flex items-center gap-2">
                💰 {job.salaryRange}
              </span>
            )}
            <span className="flex items-center gap-2">
              📅 Posted {new Date(job?.publishedAt || '').toLocaleDateString()}
            </span>
          </div>
          
          <div className="prose max-w-none">
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Description</h3>
            <p className="text-gray-600 whitespace-pre-wrap">{job?.description}</p>
            
            {job?.requirements && (
              <>
                <h3 className="text-xl font-semibold text-gray-700 mt-6 mb-2">Requirements</h3>
                <p className="text-gray-600 whitespace-pre-wrap">{job.requirements}</p>
              </>
            )}
          </div>
        </div>

        {/* Application Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Apply for this Position</h2>
          
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.firstName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="John"
                />
                {formErrors.firstName && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.firstName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.lastName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Doe"
                />
                {formErrors.lastName && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.lastName}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleInputChange}
                readOnly={!!userProfile}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  formErrors.email ? 'border-red-500' : 'border-gray-300'
                } ${userProfile ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                placeholder="john.doe@example.com"
              />
              {userProfile && (
                <p className="text-xs text-gray-500 mt-1">{t('jobApplication.emailFromProfile')}</p>
              )}
              {formErrors.email && (
                <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Years of Experience
              </label>
              <input
                type="number"
                name="yearsExperience"
                value={form.yearsExperience}
                onChange={handleInputChange}
                min="0"
                max="50"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="5"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                LinkedIn Profile URL
              </label>
              <input
                type="url"
                name="linkedinUrl"
                value={form.linkedinUrl}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Portfolio/Website URL
              </label>
              <input
                type="url"
                name="portfolioUrl"
                value={form.portfolioUrl}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://yourportfolio.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Cover Letter
              </label>
              <textarea
                name="coverLetter"
                value={form.coverLetter}
                onChange={handleInputChange}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Tell us why you're a great fit for this position..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('jobApplication.resume')} <span className="text-red-500">*</span>
              </label>

              {/* Resume source selection (only show if user has profile resume) */}
              {userProfile?.profileResume && (
                <div className="mb-4 flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="resumeSource"
                      value="profile"
                      checked={resumeSource === 'profile'}
                      onChange={() => setResumeSource('profile')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">{t('jobApplication.useProfileResume')}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="resumeSource"
                      value="upload"
                      checked={resumeSource === 'upload'}
                      onChange={() => setResumeSource('upload')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">{t('jobApplication.uploadNewResume')}</span>
                  </label>
                </div>
              )}

              {/* Show profile resume info */}
              {resumeSource === 'profile' && userProfile?.profileResume && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-green-600 text-xl">📄</span>
                    <div>
                      <p className="font-medium text-green-800">{userProfile.profileResume.originalName}</p>
                      <p className="text-sm text-green-600">
                        {(userProfile.profileResume.fileSize / 1024 / 1024).toFixed(2)} MB • 
                        {t('jobApplication.uploadedOn')} {new Date(userProfile.profileResume.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* File upload (show if no profile resume OR user chose to upload) */}
              {(resumeSource === 'upload' || !userProfile?.profileResume) && (
                <div className="mt-2">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx"
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-3 file:px-6
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100
                      file:cursor-pointer cursor-pointer"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    PDF, DOC, or DOCX (max 10MB)
                  </p>
                  {form.resume && (
                    <p className="text-sm text-green-600 mt-2">
                      ✓ {form.resume.name} ({(form.resume.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>
              )}

              {formErrors.resume && (
                <p className="text-red-500 text-sm mt-1">{formErrors.resume}</p>
              )}
            </div>

            <div className="border-t pt-6">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-8 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg hover:shadow-xl"
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
              <p className="text-xs text-gray-500 text-center mt-4">
                By submitting this application, you agree to our privacy policy and terms of service.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

