/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth.jsx';
import LandingPage from './pages/LandingPage';
import StatusCheck from './pages/StatusCheck';
import ClinicPage from './pages/ClinicPage';
import ReceptionDesk from './pages/ReceptionDesk';
import RepNotificationListener from './components/rep/RepNotificationListener';
// Rep Pages
import RepRegister from './pages/rep/RepRegister';
import RepHome from './pages/rep/RepHome';
import RepHistory from './pages/rep/RepHistory';
import RepProfile from './pages/rep/RepProfile';
import DoctorSearch from './pages/rep/DoctorSearch';
import DoctorProfile from './pages/doctor/DoctorProfile';
import AppointmentRequest from './pages/rep/AppointmentRequest';
// Doctor Pages
import DoctorRegister from './pages/doctor/DoctorRegister';
import DoctorDashboard from './pages/admin/DoctorDashboard';

function ProtectedRoute({ children, requiredRole }: { children: any; requiredRole?: string }) {
  const { user, userData, loading } = useAuth();

  if (loading) return <div className="flex h-screen items-center justify-center bg-premium-50 font-display font-medium text-gray-500 selection:bg-emerald-100">Loading...</div>;
  if (!user) return <Navigate to="/" />;
  
  if (userData && requiredRole && !userData.role?.includes(requiredRole)) {
    return <Navigate to="/" />;
  }

  // If user is authenticated but not registered in firestore users collection yet
  if (!userData && requiredRole) {
     if (requiredRole === 'rep') return <Navigate to="/rep/register" />;
     if (requiredRole === 'doctor') return <Navigate to="/doctor/register" />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <RepNotificationListener>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/status/:appointmentId" element={<StatusCheck />} />
            
            <Route path="/desk" element={<ReceptionDesk />} />
            <Route path="/clinic/:clinicSlug" element={<ClinicPage />} />
            <Route path="/clinic/:clinicSlug/desk" element={<ReceptionDesk />} />
            
            {/* Rep Routes */}
            <Route path="/rep/register" element={<ProtectedRoute><RepRegister /></ProtectedRoute>} />
            <Route path="/rep/home" element={<ProtectedRoute requiredRole="rep"><RepHome /></ProtectedRoute>} />
            <Route path="/rep/history" element={<ProtectedRoute requiredRole="rep"><RepHistory /></ProtectedRoute>} />
            <Route path="/rep/profile" element={<ProtectedRoute requiredRole="rep"><RepProfile /></ProtectedRoute>} />
            <Route path="/rep/search" element={<ProtectedRoute requiredRole="rep"><DoctorSearch /></ProtectedRoute>} />
            <Route path="/appointment/new" element={<ProtectedRoute requiredRole="rep"><AppointmentRequest /></ProtectedRoute>} />
            <Route path="/doctor/:doctorId" element={<ProtectedRoute requiredRole="rep"><DoctorProfile /></ProtectedRoute>} />
            
            {/* Doctor Routes */}
            <Route path="/doctor/register" element={<ProtectedRoute><DoctorRegister /></ProtectedRoute>} />
            <Route path="/admin/*" element={<ProtectedRoute requiredRole="doctor"><DoctorDashboard /></ProtectedRoute>} />
            
            {/* Default fallback */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </RepNotificationListener>
      </BrowserRouter>
    </AuthProvider>
  );
}

