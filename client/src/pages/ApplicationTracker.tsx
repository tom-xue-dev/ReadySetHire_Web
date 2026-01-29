import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LandingHeader from '@/components/layout/LandingHeader';
import LandingFooter from '@/components/layout/LandingFooter';

interface ApplicationStatus {
  id: number;
  jobTitle: string;
  applicantName: string;
  status: string;
  submittedAt: string;
  lastUpdated: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: string; description: string }> = {
  SUBMITTED: {
    label: 'Submitted',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: '📝',
    description: 'Your application has been received and is awaiting review.'
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    icon: '👀',
    description: 'Our team is currently reviewing your application.'
  },
  SHORTLISTED: {
    label: 'Shortlisted',
    color: 'bg-purple-100 text-purple-800 border-purple-300',
    icon: '⭐',
    description: 'Congratulations! You have been shortlisted for the next round.'
  },
  INTERVIEW_SCHEDULED: {
    label: 'Interview Scheduled',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    icon: '📅',
    description: 'An interview has been scheduled. Check your email for details.'
  },
  INTERVIEWED: {
    label: 'Interviewed',
    color: 'bg-cyan-100 text-cyan-800 border-cyan-300',
    icon: '✅',
    description: 'Interview completed. We will update you with the results soon.'
  },
  OFFER_EXTENDED: {
    label: 'Offer Extended',
    color: 'bg-green-100 text-green-800 border-green-300',
    icon: '🎉',
    description: 'Congratulations! We have extended an offer. Check your email for details.'
  },
  HIRED: {
    label: 'Hired',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    icon: '🎊',
    description: 'Welcome aboard! You have been hired for this position.'
  },
  REJECTED: {
    label: 'Not Selected',
    color: 'bg-red-100 text-red-800 border-red-300',
    icon: '❌',
    description: 'Thank you for your interest. Unfortunately, we decided to move forward with other candidates.'
  },
  WITHDRAWN: {
    label: 'Withdrawn',
    color: 'bg-gray-100 text-gray-800 border-gray-300',
    icon: '🔙',
    description: 'This application has been withdrawn.'
  },
};

export default function ApplicationTracker() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [application, setApplication] = useState<ApplicationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchToken, setSearchToken] = useState(token || '');

  useEffect(() => {
    if (token) {
      fetchApplicationStatus(token);
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchApplicationStatus = async (trackingToken: string) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/applications/track/${trackingToken}`
      );
      
      if (!response.ok) {
        throw new Error('Application not found');
      }
      
      const data = await response.json();
      setApplication(data.application);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch application status');
      setApplication(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchToken.trim()) {
      navigate(`/track/${searchToken.trim()}`);
    }
  };

  const getStatusInfo = (status: string) => {
    return statusConfig[status] || {
      label: status,
      color: 'bg-gray-100 text-gray-800 border-gray-300',
      icon: '❓',
      description: 'Status information not available.'
    };
  };

  const getProgressPercentage = (status: string): number => {
    const progression: Record<string, number> = {
      SUBMITTED: 10,
      UNDER_REVIEW: 25,
      SHORTLISTED: 40,
      INTERVIEW_SCHEDULED: 60,
      INTERVIEWED: 75,
      OFFER_EXTENDED: 90,
      HIRED: 100,
      REJECTED: 0,
      WITHDRAWN: 0,
    };
    return progression[status] || 0;
  };

  if (loading) {
    return (
      <div className="bg-white min-h-screen flex flex-col">
        <LandingHeader showNavLinks={false} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-xl text-gray-600">Loading application status...</div>
        </div>
        <LandingFooter />
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <LandingHeader showNavLinks={false} />
      
      <div className="flex-1 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              Track Your Application
            </h1>
            <p className="text-gray-600 text-lg">
              Enter your tracking number to check your application status
            </p>
          </div>

        {/* Search Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <form onSubmit={handleSearch} className="flex gap-4">
            <input
              type="text"
              value={searchToken}
              onChange={(e) => setSearchToken(e.target.value)}
              placeholder="Enter tracking number (e.g., APP-XXXX...)"
              className="flex-1 px-6 py-4 border-2 border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition shadow-lg hover:shadow-xl"
            >
              Track
            </button>
          </form>
          
          {error && (
            <div className="mt-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <p className="text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Application Status */}
        {application && (
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">
                    {application.jobTitle}
                  </h2>
                  <p className="text-gray-600">
                    Applicant: <span className="font-semibold">{application.applicantName}</span>
                  </p>
                </div>
                {/* Only show detailed status for HIRED or REJECTED */}
                {['HIRED', 'REJECTED'].includes(application.status) ? (
                  <div className={`px-6 py-3 rounded-full border-2 ${getStatusInfo(application.status).color} font-semibold text-lg`}>
                    {getStatusInfo(application.status).icon} {getStatusInfo(application.status).label}
                  </div>
                ) : (
                  <div className="px-6 py-3 rounded-full border-2 bg-blue-100 text-blue-800 border-blue-300 font-semibold text-lg">
                    ⏳ In Progress
                  </div>
                )}
              </div>

              {/* Status Description - Only show details for HIRED or REJECTED */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                {['HIRED', 'REJECTED'].includes(application.status) ? (
                  <p className="text-gray-700 text-lg">
                    {getStatusInfo(application.status).description}
                  </p>
                ) : (
                  <p className="text-gray-700 text-lg">
                    Your application is currently being processed. We will notify you once a decision has been made. Thank you for your patience.
                  </p>
                )}
              </div>

              {/* Timeline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-gray-600 font-semibold mb-1">Submitted On</p>
                  <p className="text-gray-800 text-lg">
                    {new Date(application.submittedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-gray-600 font-semibold mb-1">Last Updated</p>
                  <p className="text-gray-800 text-lg">
                    {new Date(application.lastUpdated).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Info Card */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-4 text-indigo-900">What happens next?</h3>
              <ul className="space-y-3 text-indigo-800">
                <li className="flex items-start gap-3">
                  <span className="text-2xl">📧</span>
                  <span>You will receive email updates once a decision is made</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl">🔔</span>
                  <span>Check back here to see the final result</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl">💬</span>
                  <span>Feel free to reach out if you have any questions</span>
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={() => navigate('/employee/tracking-jobs')}
                className="flex-1 bg-white text-gray-700 py-4 px-6 rounded-lg font-semibold border-2 border-gray-300 hover:bg-gray-50 transition"
              >
                Browse More Jobs
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-indigo-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition"
              >
                Refresh Status
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
      
      <LandingFooter />
    </div>
  );
}

