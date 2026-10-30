/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Search, 
  ClipboardList, 
  User, 
  FileSpreadsheet, 
  Sparkles, 
  LogOut, 
  X, 
  Building2, 
  Phone, 
  ShieldCheck, 
  ChevronRight,
  Download
} from 'lucide-react';
import { logout } from '../../lib/firebase';
import { cn } from '../../lib/utils';
import MonoTag from '../ui/MonoTag';
import LiveDot from '../ui/LiveDot';

export default function RepDrawerMenu({
  isOpen,
  onClose,
  repProfile = null,
  userData = null
}) {
  const navigate = useNavigate();
  const location = useLocation();

  if (!isOpen) return null;

  const handleLogout = async () => {
    try {
      await logout();
      onClose();
      navigate('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const navItems = [
    { to: '/rep/home', icon: Home, label: 'Home Dashboard', badge: 'Active' },
    { to: '/rep/search', icon: Search, label: 'Search Doctors', badge: null },
    { to: '/rep/dcr', icon: FileSpreadsheet, label: 'Daily Call Report (DCR)', badge: '1-Click' },
    { to: '/rep/history', icon: ClipboardList, label: 'Visit History & Passes', badge: null },
    { to: '/rep/profile', icon: User, label: 'Profile & Portfolio', badge: null },
    { to: '/pricing', icon: Sparkles, label: 'Pharma Enterprise Plans', badge: '₹499' },
  ];

  const repInitial = (userData?.name || 'R').charAt(0).toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex font-sans selection:bg-amber-100 selection:text-sand-600">
      
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-navy-950/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer Container (Sliding from Left) */}
      <div className="relative w-full max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200 border-r border-line">
        
        {/* Header / Profile Card */}
        <div className="p-5 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-900 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-lg text-white">Gatepass</span>
              <span className="w-2 h-2 rounded-[0.2rem] bg-amber-400 transform rotate-45 inline-block shadow-sm" />
              <span className="text-[0.625rem] font-mono uppercase bg-white/10 text-amber-300 font-bold px-2 py-0.5 rounded-full ml-1">
                MR PASS
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              title="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-3 relative z-10">
            <div className="w-12 h-12 rounded-[1rem] bg-gradient-to-br from-amber-400 to-amber-600 text-navy-950 font-display font-bold text-xl flex items-center justify-center shadow-md flex-shrink-0">
              {repInitial}
            </div>
            <div className="min-w-0">
              <h3 className="font-display font-bold text-white text-sm truncate">
                {userData?.name || 'Representative'}
              </h3>
              <p className="text-[0.6875rem] text-slate-300 truncate">
                {repProfile?.companyName || 'Pharmaceutical Co.'}
              </p>
              {userData?.mobile && (
                <p className="font-mono text-[0.625rem] text-teal-300 truncate mt-0.5">
                  +91 {userData.mobile}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 flex-1 overflow-y-auto space-y-1">
          <div className="px-3 pt-2 pb-1 font-mono text-[0.625rem] uppercase tracking-wider text-slate-400 font-bold">
            Field Menu
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={cn(
                  "flex items-center justify-between px-3 py-2.5 rounded-[0.875rem] font-medium transition-all text-xs group",
                  isActive
                    ? "bg-navy-900 text-white font-bold shadow-xs"
                    : "text-slate-600 hover:bg-slate-100 hover:text-ink"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn("w-4 h-4 transition-colors", isActive ? "text-amber-400" : "text-slate-400 group-hover:text-slate-600")} />
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.badge && (
                    <span className={cn(
                      "text-[0.625rem] font-mono px-2 py-0.5 rounded-full font-bold",
                      isActive ? "bg-amber-400 text-navy-950" : "bg-cream-100 text-ink-soft border border-line"
                    )}>
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
                  )}
                </div>
              </NavLink>
            );
          })}
        </nav>

        {/* DCR Quick Link Banner */}
        <div className="p-3 border-t border-line">
          <NavLink
            to="/rep/dcr"
            onClick={onClose}
            className="block p-3 rounded-[1rem] bg-teal-50 border border-teal-200 text-teal-900 text-xs hover:bg-teal-100/70 transition-colors group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-teal-700" />
                <span>Daily Call Report</span>
              </span>
              <span className="text-[0.5625rem] font-mono font-bold uppercase tracking-wider bg-teal-600 text-white px-1.5 py-0.5 rounded-full">
                Export
              </span>
            </div>
            <p className="text-[0.6875rem] text-teal-700">
              1-click CSV & WhatsApp report for area managers.
            </p>
          </NavLink>
        </div>

        {/* Sign Out Button */}
        <div className="p-3 border-t border-line">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[0.75rem] text-xs font-semibold text-slate-500 hover:text-coral-600 hover:bg-coral-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out of Account</span>
          </button>
        </div>

      </div>
    </div>
  );
}
