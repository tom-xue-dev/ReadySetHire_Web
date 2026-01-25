import { BrowserRouter, Routes, Route} from "react-router-dom";
import { authRoutes } from "./routes/auth";
import { useAuth } from "./pages/auth/AuthContext";
import { I18nProvider } from "./contexts/I18nContext";
import { AuthProvider } from "./pages/auth/AuthContext";
import AuthNotification from "./components/common/AuthNotification";
import ConditionalRoute from "./routes/ConditionalRoute";
import Home from "./pages/landing/Home.tsx";
import ProtectedRoute from "./routes/ProtectedRoute.tsx";
import HRDashboard from "./pages/dashboard/HRDashboard.tsx";
import Layout from "./components/layout/layout.tsx";
import Subscription from "./pages/dashboard/Subscription.tsx";
import Jobs from "./pages/dashboard/Jobs.tsx";
import ResumeManagement from "./pages/dashboard/ResumeManagement.tsx";
import TrackingJobs from "./pages/dashboard/TrackingJobs.tsx";
import RateResume from "./pages/dashboard/RateResume.tsx";
import Settings from "./pages/dashboard/Settings.tsx";
import EmployeeSettings from "./pages/dashboard/EmployeeSettings.tsx";
import PublicJobDetails from "./pages/PublicJobDetails.tsx";
import PublicJobApplication from "./pages/PublicJobApplication.tsx";
function AppContent() {
  const { showAuthNotification, hideAuthNotification } = useAuth();
  
  return (
    <>
      {showAuthNotification && (
        <AuthNotification onClose={hideAuthNotification} />
      )}
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          {authRoutes.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
          <Route path="/" element={
            <ConditionalRoute>
              <Home />
            </ConditionalRoute>
          } />
          <Route path="/jobs/:jobId" element={<PublicJobDetails />} />
          <Route path="/jobs/:jobId/apply" element={<PublicJobApplication />} />
          
          {/* TrackingJobs - Standalone route with role protection */}
          <Route path="/tracking-jobs" element={
            <ProtectedRoute requiredRole="EMPLOYEE">
              <TrackingJobs />
            </ProtectedRoute>
          } />
          
          {/* Rate Resume - Standalone route for ADMIN and EMPLOYEE */}
          <Route path="/rate-resume" element={
            <ProtectedRoute requiredRoles={['ADMIN', 'EMPLOYEE']}>
              <RateResume />
            </ProtectedRoute>
          } />
          
          {/* Employee Settings - Standalone route for EMPLOYEE and ADMIN */}
          <Route path="/employee/settings" element={
            <ProtectedRoute requiredRoles={['ADMIN', 'EMPLOYEE']}>
              <EmployeeSettings />
            </ProtectedRoute>
          } />
          
          {/* Dashboard routes - Protected with Layout */}
          <Route path="/*" element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/dashboard" element={<HRDashboard />} />
                  <Route path="/subscription" element={<Subscription />} />
                  <Route path="/jobs" element={<Jobs />} />
                  <Route path="/resume-management" element={<ResumeManagement />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
        </BrowserRouter>
    </>
    );
  }

function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </I18nProvider>
  )
}

export default App
