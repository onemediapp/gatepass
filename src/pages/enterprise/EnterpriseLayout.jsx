/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  LayoutDashboard, 
  Map, 
  FileText, 
  Sliders, 
  Bell, 
  ChevronDown, 
  Check, 
  Briefcase 
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../lib/auth';

export default function EnterpriseLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [selectedCompany, setSelectedCompany] = useState('Sunrise Pharma');
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);

  const companies = ['Sunrise Pharma', 'Medivo Health', 'CureWell Pharma', 'Torrent Pharma'];

  const navLinks = [
    { to: '/enterprise/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/enterprise/reps', icon: Users, label: 'Representatives' },
    { to: '/enterprise/territory', icon: Map, label: 'Territory' },
    { to: '/enterprise/reports', icon: FileText, label: 'Reports' },
    { to: '/enterprise/more', icon: Sliders, label: 'More' }
  ];

  return (
    <div className="min-h-screen bg-[#FDFEFE] font-sans text-slate-800 flex flex-col pb-20 selection:bg-orange-100 selection:text-orange-900">
      
      {/* ── Top Corporate Header (Image 12) ─────────────────────────── */}
      <header className="bg-[#0A192F] text-white px-4 sm:px-6 py-3 sticky top-0 z-40 shadow-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-lg tracking-tight">Gatepass</span>
              <span className="font-mono text-[0.625rem] uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full font-bold">
                Pharma Enterprise
              </span>
            </div>

            {/* Company switcher */}
            <div className="relative">
              <button
                onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-semibold transition-all cursor-pointer"
              >
                <span>{selectedCompany}</span>
                <ChevronDown className="w-3.5 h-3.5 text-orange-300" />
              </button>

              {showCompanyDropdown && (
                <div className="absolute left-0 top-full mt-2 w-52 bg-white rounded-[1rem] shadow-xl border border-line py-1.5 z-50 text-slate-800 animate-in fade-in">
                  {companies.map(c => (
                    <button
                      key={c}
                      onClick={() => {
                        setSelectedCompany(c);
                        setShowCompanyDropdown(false);
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-semibold hover:bg-orange-50 flex items-center justify-between transition-colors"
                    >
                      <span>{c}</span>
                      {selectedCompany === c && <Check className="w-4 h-4 text-orange-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Notifications & Avatar */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/enterprise/reports')}
              className="relative p-2 rounded-full hover:bg-white/10 text-white transition-colors"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-orange-500 ring-2 ring-[#0A192F]" />
            </button>

            <div className="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold text-xs border border-orange-400 shadow-sm">
              AS
            </div>
          </div>

        </div>
      </header>

      {/* ── Main Router View ─────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto w-full p-4 sm:p-6 flex-1">
        <Outlet />
      </main>

      {/* ── Fixed Bottom Navigation (Image 12) ───────────────────────── */}
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
                  isActive ? "text-orange-600 font-bold" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive ? "scale-110 text-orange-600" : "text-slate-400")} />
                <span className="text-[0.625rem] mt-0.5 tracking-tight font-sans">
                  {link.label}
                </span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-0.5" />
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

    </div>
  );
}
