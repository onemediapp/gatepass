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
  BarChart3,
  ShieldCheck,
  ChevronRight,
  Sparkles
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
import PricingPlans from '../pricing/PricingPlans';

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
    { to: '/admin', icon: Clock, label: 'Pending Requests', exact: true },
    { to: '/admin/today', icon: Calendar, label: "Today's Schedule", exact: true },
    { to: '/admin/upcoming', icon: CalendarDays, label: 'Upcoming Visits', exact: true },
    { to: '/admin/reps', icon: Users, label: 'Verified Reps', exact: false },
    { to: '/admin/notices', icon: Bell, label: 'Clinic Notices', exact: false },
    { to: '/admin/settings', icon: SettingsIcon, label: 'Preferences', exact: false },
  ];

  const secondaryNavItems = [
    { to: '/admin/schedule', icon: Calendar, label: 'Rep Schedule Matrix' },
    { to: '/admin/clinics', icon: Building2, label: 'Clinic Locations' },
    { to: '/admin/edit-profile', icon: User, label: 'Doctor Profile' },
    { to: '/admin/profile', icon: QrCode, label: 'QR Desk Poster' },
    { to: '/admin/owner', icon: BarChart3, label: 'Practice Analytics' },
    { to: '/admin/pricing', icon: Sparkles, label: 'Clinic Pro SaaS' },
  ];

  return (
    <div className="min-h-screen bg-cream-50 font-sans md:flex selection:bg-amber-100 selection:text-sand-600 relative">
      
      {/* Mobile Top Bar (Frosted Glass) */}
      <div className="md:hidden bg-white/85 backdrop-blur-xl border-b border-line/80 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-lg text-ink tracking-tight">Gatepass</span>
          <span className="w-2 h-2 rounded-[0.2rem] bg-amber-500 transform rotate-45 inline-block shadow-sm" />
          <span className="text-[0.625rem] font-mono uppercase bg-slate-100 text-slate-600 font-semibold px-1.5 py-0.5 rounded-full ml-1">
            Doctor
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-coral-600 hover:bg-coral-50 rounded-[0.75rem] transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-slate-600 hover:text-ink rounded-[0.75rem] transition-colors hover:bg-slate-100"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-navy-950/40 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 w-[18rem] bg-white border-r border-line z-50 transform transition-transform duration-300 md:relative md:translate-x-0 flex flex-col shadow-xl md:shadow-none",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-5 flex items-center justify-between border-b border-line">
          <div className="flex items-center gap-2.5">
            <span className="font-display font-bold text-xl tracking-tight text-ink">Gatepass</span>
            <span className="w-2.5 h-2.5 rounded-[0.25rem] bg-amber-500 transform rotate-45 inline-block shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
            <span className="text-[0.625rem] font-mono uppercase bg-navy-100 text-navy-900 font-bold px-2 py-0.5 rounded-full">
              Clinical OS
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1.5 text-slate-400 hover:text-ink rounded-[0.75rem] hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Doctor Identity Badge */}
        <div className="px-5 py-4 border-b border-line flex items-center gap-3 bg-slate-50/50">
          <div className="w-11 h-11 rounded-[0.875rem] bg-gradient-to-br from-teal-50 to-emerald-100 border border-teal-500/30 text-teal-700 flex items-center justify-center font-display font-bold text-base shadow-2xs">
            {userData?.name?.charAt(0) || 'D'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-ink truncate text-sm">
              Dr. {userData?.name?.replace(/^Dr\.?\s*/i, '')?.split(' ')[0] || 'Doctor'}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
              <p className="font-mono text-[0.625rem] text-teal-700 uppercase tracking-wider font-semibold">
                Verified Specialist
              </p>
            </div>
          </div>
        </div>

        {/* Primary Navigation */}
        <nav className="p-3 flex-1 space-y-1 overflow-y-auto">
          <div className="px-3 pt-2 pb-1 font-mono text-[0.625rem] uppercase tracking-wider text-slate-400 font-bold">
            Daily Workflow
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
                  "flex items-center justify-between px-3 py-2.5 rounded-[0.875rem] font-medium transition-all duration-150 text-xs group",
                  isActive 
                    ? "bg-navy-900 text-white font-semibold shadow-xs" 
                    : "text-slate-600 hover:bg-slate-100 hover:text-ink"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn("w-4 h-4 transition-colors", isActive ? "text-amber-400" : "text-slate-400 group-hover:text-slate-600")} />
                  <span>{item.label}</span>
                </div>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
                )}
              </NavLink>
            );
          })}

          <div className="pt-4 px-3 pb-1 font-mono text-[0.625rem] uppercase tracking-wider text-slate-400 font-bold">
            Clinic & Settings
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
                  "flex items-center justify-between px-3 py-2.5 rounded-[0.875rem] font-medium transition-all duration-150 text-xs group",
                  isActive 
                    ? "bg-navy-900 text-white font-semibold shadow-xs" 
                    : "text-slate-600 hover:bg-slate-100 hover:text-ink"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn("w-4 h-4 transition-colors", isActive ? "text-amber-400" : "text-slate-400 group-hover:text-slate-600")} />
                  <span>{item.label}</span>
                </div>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* SaaS Pro Banner */}
        <div className="p-3 border-t border-line">
          <NavLink
            to="/admin/pricing"
            onClick={() => setSidebarOpen(false)}
            className="block p-3 rounded-[1rem] bg-navy-900 text-white text-xs hover:bg-navy-800 border border-navy-800 transition-all shadow-sm group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-[0.625rem] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" /> Clinic Pro
              </span>
              <span className="text-[0.625rem] bg-amber-400/20 text-amber-300 font-mono font-bold px-1.5 py-0.5 rounded-full">
                ₹1,499/mo
              </span>
            </div>
            <p className="text-[0.6875rem] text-slate-300">
              Kiosk mode, staff delegation & automated WhatsApp alerts.
            </p>
          </NavLink>
        </div>

        {/* Sign Out */}
        <div className="p-3 border-t border-line">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-[0.875rem] font-medium text-slate-500 hover:text-coral-600 hover:bg-coral-50/80 transition-colors w-full text-xs"
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
          <Route path="/pricing" element={<PricingPlans />} />
          
          {/* Fallback & Redirections */}
          <Route path="/approved" element={<Navigate to="/admin/today" replace />} />
          <Route path="/rejected" element={<Navigate to="/admin/upcoming" replace />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </main>
    </div>
  );
}
