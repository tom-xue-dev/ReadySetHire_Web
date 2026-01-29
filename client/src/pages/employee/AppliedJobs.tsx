import { useEffect, useState } from 'react';
import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import { apiRequest } from '@/api/api';
import { useAuth } from '@/pages/auth/AuthContext';
import LandingHeader from '@/components/layout/LandingHeader';
import LandingFooter from '@/components/layout/LandingFooter';
import { useI18n } from '@/contexts/I18nContext';

interface AppliedJob {
  id: number;
  jobId: number;
  status: string;
  trackingToken: string;
  createdAt: string;
  updatedAt: string;
  job?: {
    id: number;
    title: string;
    location?: string;
    description?: string;
  };
}

export default function AppliedJobs() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<AppliedJob[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMyApplications();
  }, [user?.id]);

  async function loadMyApplications() {
    if (!user?.email) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest(`/applications/my?email=${encodeURIComponent(user.email)}`);
      const data = (response as any)?.applications || [];
      setApplications(data);
    } catch (err: any) {
      console.error('Failed to load applications:', err);
      setError(err?.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  }

  function getStatusDisplay(status: string) {
    if (status === 'HIRED') {
      return {
        label: t('appliedJobs.status.hired'),
        className: 'bg-green-100 text-green-800 border-green-300'
      };
    } else if (status === 'REJECTED') {
      return {
        label: t('appliedJobs.status.rejected'),
        className: 'bg-red-100 text-red-800 border-red-300'
      };
    } else {
      return {
        label: t('appliedJobs.status.inProgress'),
        className: 'bg-blue-100 text-blue-800 border-blue-300'
      };
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <LandingHeader showNavLinks={false} />
      
      <div className="flex-1 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <ClipboardDocumentListIcon className="w-8 h-8 text-indigo-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('appliedJobs.title')}</h1>
              <p className="text-gray-600">{t('appliedJobs.subtitle')}</p>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="text-center py-12 text-gray-500">
              {t('forms.loading')}
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">
              {error}
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardDocumentListIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">{t('appliedJobs.noApplications')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => {
                const statusInfo = getStatusDisplay(app.status);
                const isFinal = ['HIRED', 'REJECTED'].includes(app.status);
                
                return (
                  <div
                    key={app.id}
                    className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {app.job?.title || 'Unknown Position'}
                        </h3>
                        {app.job?.location && (
                          <p className="text-sm text-gray-600 mb-2">
                            📍 {app.job.location}
                          </p>
                        )}
                        <p className="text-sm text-gray-500">
                          {t('appliedJobs.appliedOn')}: {formatDate(app.createdAt)}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <span className={`inline-flex px-4 py-2 rounded-full border text-sm font-medium ${statusInfo.className}`}>
                          {isFinal ? (app.status === 'HIRED' ? '🎉' : '❌') : '⏳'} {statusInfo.label}
                        </span>
                        
                        {isFinal && (
                          <p className="text-xs text-gray-500 mt-2">
                            {t('appliedJobs.decidedOn')}: {formatDate(app.updatedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Tracking Token for reference */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-xs text-gray-400">
                        {t('appliedJobs.trackingNumber')}: <span className="font-mono">{app.trackingToken}</span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      <LandingFooter />
    </div>
  );
}
