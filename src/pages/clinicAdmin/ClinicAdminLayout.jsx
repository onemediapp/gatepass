/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  Calendar, 
  LayoutDashboard, 
  Sliders, 
  Bell, 
  ChevronDown, 
  Check, 
  ShieldCheck, 
  Plus, 
  LogOut,
  MapPin,
  Clock,
  Menu,
  X
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../lib/auth';

export default function ClinicAdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [selectedClinic, setSelectedClinic] = useState({
    id: 'remedi-kurnool-main',
    name: 'Remedi Clinic',
    city: 'Kurnool',
    primary: true
  });
  const [showClinicDropdown, setShowClinicDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const clinics = [
    { id: 'remedi-kurnool-main', name: 'Remedi Clinic (Kurnool)', role: 'Primary Branch' },
    { id: 'remedi-nandyal', name: 'Remedi Clinic (Nandyal)', role: 'Branch' },
    { id: 'remedi-adoni', name: 'Remedi Clinic (Adoni)', role: 'Branch' }
  ];

  const navLinks = [
    { to: '/clinic-admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/clinic-admin/doctors', icon: Users, label: 'Doctors' },
    { to: '/clinic-admin/schedules', icon: Calendar, label: 'Appointments' },
    { to: '/clinic-admin/branches', icon: Building2, label: 'Branches' },
    { to: '/clinic-admin/rules', icon: Sliders, label: 'More' }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAF9] font-sans text-slate-800 flex flex-col pb-20 selection:bg-emerald-100 selection:text-emerald-800">
      
      {/* ── Top Header Bar (Emerald Brand - Images 11 & 13) ─────────── */}
      <header className="bg-[#064E3B] text-white px-4 sm:px-6 py-3 sticky top-0 z-40 shadow-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          
          {/* Left: Branding & Clinic Switcher */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-[0.5rem] hover:bg-white/10 md:hidden"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-lg tracking-tight">Gatepass</span>
              <span className="hidden sm:inline-block font-mono text-[0.625rem] uppercase tracking-wider bg-emerald-800/80 text-emerald-200 border border-emerald-700 px-2 py-0.5 rounded-full font-bold">
                Clinic Management
              </span>
            </div>

            {/* Clinic Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowClinicDropdown(!showClinicDropdown)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-semibold transition-all cursor-pointer"
              >
                <span className="truncate max-w-[130px] sm:max-w-[200px]">
                  {selectedClinic.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-emerald-200" />
              </button>

              {showClinicDropdown && (
                <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-[1rem] shadow-xl border border-line py-1.5 z-50 text-slate-800 animate-in fade-in">
                  <div className="px-3 py-1.5 border-b border-line">
                    <span className="text-[0.6875rem] font-mono text-slate-400 uppercase tracking-wider font-bold">
                      Switch Active Location
                    </span>
                  </div>
                  {clinics.map(c => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setSelectedClinic({ id: c.id, name: c.name, city: 'Kurnool', primary: c.id.includes('main') });
                        setShowClinicDropdown(false);
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-semibold hover:bg-emerald-50 flex items-center justify-between transition-colors"
                    >
                      <div>
                        <p className="font-bold text-ink">{c.name}</p>
                        <p className="text-[0.625rem] text-slate-500">{c.role}</p>
                      </div>
                      {selectedClinic.id === c.id && <Check className="w-4 h-4 text-emerald-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Notifications & User Avatar */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/clinic-admin/rules')}
              className="relative p-2 rounded-full hover:bg-white/10 text-white transition-colors"
              title="Notices"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-[#064E3B]" />
            </button>

            <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs border border-emerald-500 shadow-sm">
              R
            </div>
          </div>

        </div>
      </header>

      {/* ── Main Router View ─────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto w-full p-4 sm:p-6 flex-1">
        <Outlet />
      </main>

      {/* ── Fixed Bottom Navigation (Images 11 & 13) ─────────────────── */}
      <nav className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-xl border-t border-slate-200 z-40 shadow-[0_-8px_24px_rgba(0,0,0,0.05)]">
        <div className="max-w-md mx-auto flex justify-between items-center px-4 py-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname.startsWith(link.to);
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 py-1 rounded-[0.75rem] transition-all",
                  isActive ? "text-[#064E3B] font-bold" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive ? "scale-110 text-[#064E3B]" : "text-slate-400")} />
                <span className="text-[0.625rem] mt-0.5 tracking-tight font-sans">
                  {link.label}
                </span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#047857] mt-0.5" />
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

    </div>
  );
}
