import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import DataTable from '../components/DataTable';
import { downloadResume } from '@/api/application';

interface Application {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  status: string;
  yearsExperience: number | null;
  createdAt: string;
  resume: {
    id: number;
    originalName: string;
    fileSize: number;
  } | null;
}

const statusOptions = [
  { value: 'SUBMITTED', label: '📝 Submitted', color: 'bg-blue-100 text-blue-800' },
  { value: 'UNDER_REVIEW', label: '👀 Under Review', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'SHORTLISTED', label: '⭐ Shortlisted', color: 'bg-purple-100 text-purple-800' },
  { value: 'INTERVIEW_SCHEDULED', label: '📅 Interview Scheduled', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'INTERVIEWED', label: '✅ Interviewed', color: 'bg-cyan-100 text-cyan-800' },
  { value: 'OFFER_EXTENDED', label: '🎉 Offer Extended', color: 'bg-green-100 text-green-800' },
  { value: 'HIRED', label: '🎊 Hired', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'REJECTED', label: '❌ Rejected', color: 'bg-red-100 text-red-800' },
];

export default function ApplicationManagement() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [jobTitle, setJobTitle] = useState<string>('');

  useEffect(() => {
    if (jobId) {
      fetchJob();
      fetchApplications();
    }
  }, [jobId, filterStatus, searchTerm]);

  const fetchJob = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/jobs/${jobId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      setJobTitle(data.title || 'Job');
    } catch (error) {
      console.error('Failed to fetch job:', error);
    }
  };

  const fetchApplications = async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/jobs/${jobId}/applications?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
      const data = await response.json();
      setApplications(data.applications || []);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (applicationId: number, newStatus: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/applications/${applicationId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.ok) {
        fetchApplications(); // Refresh list
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    return statusOption?.color || 'bg-gray-100 text-gray-800';
  };

  const columns = [
    {
      header: 'Candidate',
      render: (app: Application) => (
        <div>
          <div className="font-semibold text-gray-900">
            {app.firstName} {app.lastName}
          </div>
          <div className="text-sm text-gray-500">{app.email}</div>
        </div>
      ),
    },
    {
      header: 'Phone',
      render: (app: Application) => app.phone || '—',
    },
    {
      header: 'Experience',
      render: (app: Application) => 
        app.yearsExperience ? `${app.yearsExperience} years` : '—',
    },
    {
      header: 'Status',
      render: (app: Application) => (
        <select
          value={app.status}
          onChange={(e) => handleStatusChange(app.id, e.target.value)}
          className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(app.status)} border-0 cursor-pointer`}
        >
          {statusOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ),
    },
    {
      header: 'Applied',
      render: (app: Application) => new Date(app.createdAt).toLocaleDateString(),
    },
    {
      header: 'Actions',
      render: (app: Application) => (
        <div className="flex gap-2">
          {app.resume && (
            <button
              onClick={() => downloadResume(app.resume!.id)}
              className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
              title="Download Resume"
            >
              📄 Resume
            </button>
          )}
          <button
            onClick={() => {
              setSelectedApplication(app);
              setShowDetailsModal(true);
            }}
            className="text-purple-600 hover:text-purple-800 font-semibold text-sm"
          >
            View Details
          </button>
        </div>
      ),
    },
  ];

  const filteredApplications = applications.filter(app => {
    const matchesSearch = 
      searchTerm === '' ||
      `${app.firstName} ${app.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === '' || app.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: applications.length,
    byStatus: applications.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-600">Loading applications...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Applications</h1>
            <p className="text-gray-600 mt-1">
              Managing applications for: <span className="font-semibold">{jobTitle}</span>
            </p>
          </div>
          <button
            onClick={() => navigate('/jobs')}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
          >
            ← Back to Jobs
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Applications</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {stats.byStatus['UNDER_REVIEW'] || 0}
            </div>
            <div className="text-sm text-gray-600">Under Review</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600">
              {stats.byStatus['SHORTLISTED'] || 0}
            </div>
            <div className="text-sm text-gray-600">Shortlisted</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">
              {(stats.byStatus['OFFER_EXTENDED'] || 0) + (stats.byStatus['HIRED'] || 0)}
            </div>
            <div className="text-sm text-gray-600">Offers/Hired</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-lg shadow">
        {filteredApplications.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-4">📭</div>
            <p>No applications found</p>
          </div>
        ) : (
          <DataTable
            data={filteredApplications}
            columns={columns}
            rowKey={(row: Application) => row.id}
          />
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Application Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-600">Full Name</label>
                <p className="text-lg">{selectedApplication.firstName} {selectedApplication.lastName}</p>
              </div>
              
              <div>
                <label className="text-sm font-semibold text-gray-600">Email</label>
                <p className="text-lg">{selectedApplication.email}</p>
              </div>
              
              {selectedApplication.phone && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Phone</label>
                  <p className="text-lg">{selectedApplication.phone}</p>
                </div>
              )}
              
              {selectedApplication.yearsExperience !== null && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Experience</label>
                  <p className="text-lg">{selectedApplication.yearsExperience} years</p>
                </div>
              )}
              
              <div>
                <label className="text-sm font-semibold text-gray-600">Status</label>
                <div className="mt-2">
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold inline-block ${getStatusColor(selectedApplication.status)}`}>
                    {statusOptions.find(opt => opt.value === selectedApplication.status)?.label}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-semibold text-gray-600">Applied On</label>
                <p className="text-lg">{new Date(selectedApplication.createdAt).toLocaleString()}</p>
              </div>
              
              {selectedApplication.resume && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Resume</label>
                  <button
                    onClick={() => downloadResume(selectedApplication.resume!.id)}
                    className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    📄 Download {selectedApplication.resume.originalName}
                    <span className="text-sm">
                      ({(selectedApplication.resume.fileSize / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

