/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { 
  LogOut, 
  Clock, 
  Calendar, 
  CalendarDays, 
  Users, 
  Bell, 
  Settings as SettingsIcon, 
  Menu, 
  X, 
  QrCode, 
  User, 
  Building2,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { logout } from '../../lib/firebase';
import { cn } from '../../lib/utils';
import { sweepExpiredAppointments } from '../../lib/db/appointments';
import DoctorPendingRequests from './DoctorPendingRequests';
import DoctorToday from './DoctorToday';
import DoctorUpcoming from './DoctorUpcoming';
import DoctorReps from './DoctorReps';
import DoctorNotices from './DoctorNotices';
import DoctorSettings from './DoctorSettings';
import DoctorClinics from './DoctorClinics';
import DoctorProfileEdit from './DoctorProfileEdit';
import DoctorProfileLinks from './DoctorProfileLinks';
import DoctorScheduleSettings from '../doctor/DoctorScheduleSettings';
import OwnerStats from './OwnerStats';

export default function DoctorDashboard() {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      sweepExpiredAppointments(user.uid, 'doctor').catch(err => console.warn('Doctor sweep error:', err));
    }
  }, [user?.uid]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems = [
    { to: '/admin', icon: Clock, label: 'Pending', exact: true },
    { to: '/admin/today', icon: Calendar, label: 'Today', exact: true },
    { to: '/admin/upcoming', icon: CalendarDays, label: 'Upcoming', exact: true },
    { to: '/admin/reps', icon: Users, label: 'My Reps', exact: false },
    { to: '/admin/notices', icon: Bell, label: 'Notices', exact: false },
    { to: '/admin/settings', icon: SettingsIcon, label: 'Settings', exact: false },
  ];

  const secondaryNavItems = [
    { to: '/admin/schedule', icon: Calendar, label: 'Rep Schedule' },
    { to: '/admin/clinics', icon: Building2, label: 'Clinics' },
    { to: '/admin/edit-profile', icon: User, label: 'Doctor Profile' },
    { to: '/admin/profile', icon: QrCode, label: 'QR & Poster' },
    { to: '/admin/owner', icon: BarChart3, label: 'Owner Pulse' },
  ];

  return (
    <div className="min-h-screen bg-cream-50 font-sans md:flex selection:bg-amber-100 selection:text-sand-600 relative">
      
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-white/95 backdrop-blur-md border-b border-line px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-lg text-ink">Gatepass</span>
          <span className="w-2 h-2 rounded-[0.1875rem] bg-amber-500 transform rotate-45 inline-block" />
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleLogout}
            className="p-2 text-coral-600 hover:bg-coral-50 rounded-[0.75rem] transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-ink-mute hover:text-ink rounded-[0.75rem] transition-colors hover:bg-cream-50"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-navy-900/40 backdrop-blur-sm z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 w-[17.5rem] bg-white border-r border-line z-50 transform transition-transform duration-300 md:relative md:translate-x-0 flex flex-col shadow-sm md:shadow-none",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-5 flex items-center justify-between border-b border-line">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-xl tracking-tight text-ink">Gatepass</span>
            <span className="w-2.5 h-2.5 rounded-[0.25rem] bg-amber-500 transform rotate-45 inline-block" />
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1.5 text-ink-mute hover:text-ink rounded-[0.75rem] hover:bg-cream-50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Doctor Identity Badge */}
        <div className="px-5 py-4 border-b border-line flex items-center gap-3 bg-cream-50/50">
          <div className="w-10 h-10 rounded-[0.875rem] bg-teal-50 border border-teal-600/20 text-teal-600 flex items-center justify-center font-display font-bold text-base shadow-sm">
            {userData?.name?.charAt(0) || 'D'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-ink truncate text-sm">
              Dr. {userData?.name?.replace(/^Dr\.?\s*/i, '')?.split(' ')[0] || 'Karthik'}
            </p>
            <p className="font-mono text-[0.625rem] text-teal-600 uppercase tracking-wider">
              Verified Doctor
            </p>
          </div>
        </div>

        {/* Primary Navigation */}
        <nav className="p-3 flex-1 space-y-1 overflow-y-auto">
          <div className="px-3 py-1 font-mono text-[0.625rem] uppercase tracking-wider text-ink-mute font-semibold">
            Overview
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? location.pathname === item.to || (item.to === '/admin' && location.pathname === '/admin/pending')
              : location.pathname.startsWith(item.to);

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-[0.875rem] font-medium transition-all text-xs",
                  isActive 
                    ? "bg-navy-900 text-white font-semibold shadow-sm" 
                    : "text-ink-soft hover:bg-cream-50 hover:text-ink"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "text-amber-500" : "text-ink-mute")} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}

          <div className="pt-3 px-3 py-1 font-mono text-[0.625rem] uppercase tracking-wider text-ink-mute font-semibold">
            Practice
          </div>
          {secondaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-[0.875rem] font-medium transition-all text-xs",
                  isActive 
                    ? "bg-navy-900 text-white font-semibold shadow-sm" 
                    : "text-ink-soft hover:bg-cream-50 hover:text-ink"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "text-amber-500" : "text-ink-mute")} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Sign Out */}
        <div className="p-3 border-t border-line">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-[0.875rem] font-medium text-coral-600 hover:bg-coral-50 transition-colors w-full text-xs"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto p-4 sm:p-8 h-[100dvh] overflow-y-auto scroll-smooth">
        <Routes>
          <Route path="/" element={<DoctorPendingRequests />} />
          <Route path="/pending" element={<DoctorPendingRequests />} />
          <Route path="/today" element={<DoctorToday />} />
          <Route path="/upcoming" element={<DoctorUpcoming />} />
          <Route path="/reps" element={<DoctorReps />} />
          <Route path="/notices" element={<DoctorNotices />} />
          <Route path="/settings" element={<DoctorSettings />} />
          <Route path="/schedule" element={<DoctorScheduleSettings />} />
          <Route path="/clinics" element={<DoctorClinics />} />
          <Route path="/edit-profile" element={<DoctorProfileEdit />} />
          <Route path="/profile" element={<DoctorProfileLinks />} />
          <Route path="/owner" element={<OwnerStats />} />
          
          {/* Fallback & Redirections */}
          <Route path="/approved" element={<Navigate to="/admin/today" replace />} />
          <Route path="/rejected" element={<Navigate to="/admin/upcoming" replace />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </main>
    </div>
  );
}
