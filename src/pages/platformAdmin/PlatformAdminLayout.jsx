/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  ShieldCheck, 
  Building2, 
  Users, 
  LayoutDashboard, 
  CreditCard, 
  Sliders, 
  Bell, 
  ChevronDown, 
  Check, 
  Stethoscope,
  LogOut
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../lib/auth';
import { logout } from '../../lib/firebase';

export default function PlatformAdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  const locations = ['All Locations', 'Kurnool Region', 'Anantapur Region', 'Kadapa Region'];

  const navLinks = [
    { to: '/platform-admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/platform-admin/verify-clinics', icon: Building2, label: 'Clinics' },
    { to: '/platform-admin/verify-doctors', icon: Stethoscope, label: 'Doctors' },
    { to: '/platform-admin/verify-pharma', icon: Users, label: 'Representatives' },
    { to: '/platform-admin/subscriptions', icon: CreditCard, label: 'Billing' }
  ];

  return (
    <div className="min-h-screen bg-[#FBFBFE] font-sans text-slate-800 flex flex-col pb-20 selection:bg-purple-100 selection:text-purple-900">
      
      {/* ── Top Header Bar (Royal Purple & Indigo - Image 16) ──────── */}
      <header className="bg-[#1E1B4B] text-white px-4 sm:px-6 py-3 sticky top-0 z-40 shadow-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-lg tracking-tight">Gatepass</span>
              <span className="font-mono text-[0.625rem] uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-bold">
                Platform Admin
              </span>
            </div>

            {/* Location selector */}
            <div className="relative">
              <button
                onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-semibold transition-all cursor-pointer"
              >
                <span>{selectedLocation}</span>
                <ChevronDown className="w-3.5 h-3.5 text-purple-300" />
              </button>

              {showLocationDropdown && (
                <div className="absolute left-0 top-full mt-2 w-48 bg-white rounded-[1rem] shadow-xl border border-line py-1.5 z-50 text-slate-800 animate-in fade-in">
                  {locations.map(loc => (
                    <button
                      key={loc}
                      onClick={() => {
                        setSelectedLocation(loc);
                        setShowLocationDropdown(false);
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-semibold hover:bg-purple-50 flex items-center justify-between transition-colors"
                    >
                      <span>{loc}</span>
                      {selectedLocation === loc && <Check className="w-4 h-4 text-purple-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Notifications, User & Sign Out */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => navigate('/platform-admin/subscriptions')}
              className="relative p-2 rounded-full hover:bg-white/10 text-white transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-purple-400 ring-2 ring-[#1E1B4B]" />
            </button>

            <div className="flex items-center gap-2 pl-1 border-l border-white/20">
              <div 
                className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-xs border border-purple-400 shadow-sm"
                title={user?.email || 'onemediapp@gmail.com'}
              >
                {user?.email ? user.email[0].toUpperCase() : 'O'}
              </div>
              <span className="hidden sm:inline-block text-xs font-medium text-purple-200 max-w-[140px] truncate">
                {user?.email || 'onemediapp@gmail.com'}
              </span>
            </div>

            <button
              onClick={async () => {
                await logout();
                navigate('/');
              }}
              className="p-2 rounded-full hover:bg-white/10 text-purple-300 hover:text-white transition-colors ml-1"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* ── Main Router View ─────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto w-full p-4 sm:p-6 flex-1">
        <Outlet />
      </main>

      {/* ── Fixed Bottom Navigation (Image 16) ───────────────────────── */}
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
                  isActive ? "text-purple-600 font-bold" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive ? "scale-110 text-purple-600" : "text-slate-400")} />
                <span className="text-[0.625rem] mt-0.5 tracking-tight font-sans">
                  {link.label}
                </span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-600 mt-0.5" />
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

    </div>
  );
}
