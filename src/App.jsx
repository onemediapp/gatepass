/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth.jsx';
import RepNotificationListener from './components/rep/RepNotificationListener';
import PWAUpdateToast from './components/ui/PWAUpdateToast';

// Lazy Loaded Pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const StatusCheck = lazy(() => import('./pages/StatusCheck'));
const ClinicPage = lazy(() => import('./pages/ClinicPage'));

// Rep Pages
const RepRegister = lazy(() => import('./pages/rep/RepRegister'));
const RepHome = lazy(() => import('./pages/rep/RepHome'));
const RepHistory = lazy(() => import('./pages/rep/RepHistory'));
const RepProfile = lazy(() => import('./pages/rep/RepProfile'));
const RepDCR = lazy(() => import('./pages/rep/RepDCR'));
const DoctorSearch = lazy(() => import('./pages/rep/DoctorSearch'));
const DoctorProfile = lazy(() => import('./pages/doctor/DoctorProfile'));
const SlotPicker = lazy(() => import('./pages/rep/SlotPicker'));
const RequestDetails = lazy(() => import('./pages/rep/RequestDetails'));
const RepNotices = lazy(() => import('./pages/rep/RepNotices'));
const RepNotifications = lazy(() => import('./pages/rep/RepNotifications'));

// Reception & SaaS Pages
const ReceptionKiosk = lazy(() => import('./pages/kiosk/ReceptionKiosk'));
const PricingPlans = lazy(() => import('./pages/pricing/PricingPlans'));

// Doctor Pages
const DoctorRegister = lazy(() => import('./pages/doctor/DoctorRegister'));
const DoctorDashboard = lazy(() => import('./pages/admin/DoctorDashboard'));
const DoctorScheduleSettings = lazy(() => import('./pages/doctor/DoctorScheduleSettings'));
const ClinicPrintPoster = lazy(() => import('./pages/print/ClinicPrintPoster'));

// Clinic Management Portal Pages
const ClinicAdminLayout = lazy(() => import('./pages/clinicAdmin/ClinicAdminLayout'));
const ClinicDashboard = lazy(() => import('./pages/clinicAdmin/ClinicDashboard'));
const DoctorDirectory = lazy(() => import('./pages/clinicAdmin/DoctorDirectory'));
const StaffPermissions = lazy(() => import('./pages/clinicAdmin/StaffPermissions'));
const BranchDirectory = lazy(() => import('./pages/clinicAdmin/BranchDirectory'));
const BranchDetails = lazy(() => import('./pages/clinicAdmin/BranchDetails'));
const LocationSchedules = lazy(() => import('./pages/clinicAdmin/LocationSchedules'));
const ClinicRulesNotices = lazy(() => import('./pages/clinicAdmin/ClinicRulesNotices'));

// Pharma Enterprise Portal Pages
const EnterpriseLayout = lazy(() => import('./pages/enterprise/EnterpriseLayout'));
const EnterpriseDashboard = lazy(() => import('./pages/enterprise/EnterpriseDashboard'));
const EnterpriseReps = lazy(() => import('./pages/enterprise/EnterpriseReps'));
const EnterpriseTerritory = lazy(() => import('./pages/enterprise/EnterpriseTerritory'));
const EnterpriseAnalytics = lazy(() => import('./pages/enterprise/EnterpriseAnalytics'));

// Platform Admin Portal Pages
const PlatformAdminLayout = lazy(() => import('./pages/platformAdmin/PlatformAdminLayout'));
const AdminDashboard = lazy(() => import('./pages/platformAdmin/AdminDashboard'));
const DoctorClinicVerification = lazy(() => import('./pages/platformAdmin/DoctorClinicVerification'));
const MRCompanyVerification = lazy(() => import('./pages/platformAdmin/MRCompanyVerification'));
const PlatformSubscriptions = lazy(() => import('./pages/platformAdmin/PlatformSubscriptions'));



function PageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream-50 font-sans" role="status" aria-label="Loading page">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-[1rem] bg-navy-900 text-white flex items-center justify-center font-display font-bold text-xl shadow-card animate-pulse">
          G
        </div>
        <div className="w-24 h-1.5 bg-line rounded-full overflow-hidden">
          <div className="w-full h-full bg-navy-900/40 animate-pulse" />
        </div>
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
}

function ProtectedRoute({ children, requiredRole }) {
  const { user, userData, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageFallback />;
  }
  if (!user) {
    const currentPath = location.pathname + location.search;
    return <Navigate to={`/?redirect=${encodeURIComponent(currentPath)}`} state={{ from: location }} replace />;
  }

  if (userData && requiredRole && !userData.role?.includes(requiredRole)) {
    return <Navigate to="/" replace />;
  }

  // If user is authenticated but not registered in firestore users collection yet
  if (!userData && requiredRole) {
    if (requiredRole === 'rep') return <Navigate to="/rep/register" replace />;
    if (requiredRole === 'doctor') return <Navigate to="/doctor/register" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <RepNotificationListener>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/pricing" element={<PricingPlans />} />
              <Route path="/plans" element={<PricingPlans />} />
              <Route path="/status/:appointmentId" element={<ProtectedRoute><StatusCheck /></ProtectedRoute>} />
              <Route path="/clinic/:slug" element={<ClinicPage />} />
              <Route path="/clinic/:clinicSlug" element={<ClinicPage />} />
              <Route path="/clinic/:clinicSlug/reception" element={<ReceptionKiosk />} />
              <Route path="/kiosk/:clinicSlug" element={<ReceptionKiosk />} />

              {/* Rep Routes */}
              <Route path="/rep/register" element={<ProtectedRoute><RepRegister /></ProtectedRoute>} />
              <Route path="/rep/home" element={<ProtectedRoute requiredRole="rep"><RepHome /></ProtectedRoute>} />
              <Route path="/rep/history" element={<ProtectedRoute requiredRole="rep"><RepHistory /></ProtectedRoute>} />
              <Route path="/rep/profile" element={<ProtectedRoute requiredRole="rep"><RepProfile /></ProtectedRoute>} />
              <Route path="/rep/dcr" element={<ProtectedRoute requiredRole="rep"><RepDCR /></ProtectedRoute>} />
              <Route path="/rep/search" element={<ProtectedRoute requiredRole="rep"><DoctorSearch /></ProtectedRoute>} />
              <Route path="/rep/notices" element={<ProtectedRoute requiredRole="rep"><RepNotices /></ProtectedRoute>} />
              <Route path="/rep/notifications" element={<ProtectedRoute requiredRole="rep"><RepNotifications /></ProtectedRoute>} />
              <Route path="/dr/:slug" element={<ProtectedRoute requiredRole="rep"><DoctorProfile /></ProtectedRoute>} />
              <Route path="/dr/:slug/slots" element={<ProtectedRoute requiredRole="rep"><SlotPicker /></ProtectedRoute>} />
              <Route path="/dr/:slug/request" element={<ProtectedRoute requiredRole="rep"><RequestDetails /></ProtectedRoute>} />
              <Route path="/dr/:doctorId" element={<ProtectedRoute requiredRole="rep"><DoctorProfile /></ProtectedRoute>} />
              <Route path="/doctor/:doctorId" element={<ProtectedRoute requiredRole="rep"><DoctorProfile /></ProtectedRoute>} />

              {/* Doctor Routes */}
              <Route path="/doctor/register" element={<ProtectedRoute><DoctorRegister /></ProtectedRoute>} />
              <Route path="/doctor/settings/schedule" element={<ProtectedRoute requiredRole="doctor"><DoctorScheduleSettings /></ProtectedRoute>} />
              <Route path="/print/clinic/:clinicId" element={<ProtectedRoute requiredRole="doctor"><ClinicPrintPoster /></ProtectedRoute>} />
              <Route path="/admin/*" element={<ProtectedRoute requiredRole="doctor"><DoctorDashboard /></ProtectedRoute>} />

              {/* Clinic Management Portal */}
              <Route path="/clinic-admin" element={<ProtectedRoute><ClinicAdminLayout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/clinic-admin/dashboard" replace />} />
                <Route path="dashboard" element={<ClinicDashboard />} />
                <Route path="doctors" element={<DoctorDirectory />} />
                <Route path="staff" element={<StaffPermissions />} />
                <Route path="branches" element={<BranchDirectory />} />
                <Route path="branch/:branchId" element={<BranchDetails />} />
                <Route path="schedules" element={<LocationSchedules />} />
                <Route path="rules" element={<ClinicRulesNotices />} />
              </Route>

              {/* Pharma Enterprise Portal */}
              <Route path="/enterprise" element={<ProtectedRoute><EnterpriseLayout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/enterprise/dashboard" replace />} />
                <Route path="dashboard" element={<EnterpriseDashboard />} />
                <Route path="reps" element={<EnterpriseReps />} />
                <Route path="territory" element={<EnterpriseTerritory />} />
                <Route path="reports" element={<EnterpriseAnalytics />} />
              </Route>

              {/* Platform Admin Portal */}
              <Route path="/platform-admin" element={<ProtectedRoute><PlatformAdminLayout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/platform-admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="verify-clinics" element={<DoctorClinicVerification />} />
                <Route path="verify-doctors" element={<DoctorClinicVerification />} />
                <Route path="verify-pharma" element={<MRCompanyVerification />} />
                <Route path="subscriptions" element={<PlatformSubscriptions />} />
              </Route>

              <Route path="/owner" element={<Navigate to="/admin/owner" replace />} />

              {/* Default fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
          <PWAUpdateToast />
        </RepNotificationListener>
      </BrowserRouter>
    </AuthProvider>
  );
}
