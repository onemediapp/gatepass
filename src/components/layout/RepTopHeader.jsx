/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Menu, FileSpreadsheet, User, Search, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import RepDrawerMenu from './RepDrawerMenu';
import MonoTag from '../ui/MonoTag';

export default function RepTopHeader({
  repProfile = null,
  showDcrButton = true,
  title = null,
  subtitle = null,
  className = ''
}) {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <header className={`bg-white/90 backdrop-blur-md border-b border-line px-4 py-2.5 sticky top-0 z-30 shadow-2xs ${className}`}>
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          
          {/* Left: Hamburger Menu Button & Logo */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="p-2 -ml-1 text-slate-700 hover:text-navy-950 hover:bg-slate-100 rounded-[0.75rem] transition-colors flex items-center gap-1.5 active:scale-95 cursor-pointer"
              aria-label="Open field menu"
            >
              <Menu className="w-5 h-5 text-navy-900" />
              <span className="font-bold text-xs hidden xs:inline text-navy-900">Menu</span>
            </button>

            {title ? (
              <div>
                <h2 className="font-display font-bold text-sm text-ink leading-tight">{title}</h2>
                {subtitle && <p className="text-[0.6875rem] text-ink-mute leading-none">{subtitle}</p>}
              </div>
            ) : (
              <div 
                onClick={() => navigate('/rep/home')}
                className="flex items-center gap-1.5 cursor-pointer select-none"
              >
                <span className="font-display font-bold text-base text-ink tracking-tight">Gatepass</span>
                <span className="w-2 h-2 rounded-[0.2rem] bg-amber-500 transform rotate-45 inline-block shadow-sm" />
                <span className="text-[0.5625rem] font-mono uppercase bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded-full ml-0.5">
                  Rep
                </span>
              </div>
            )}
          </div>

          {/* Right: Quick DCR or Profile Button */}
          <div className="flex items-center gap-1.5">
            {showDcrButton && (
              <button
                type="button"
                onClick={() => navigate('/rep/dcr')}
                className="px-2.5 py-1.5 rounded-[0.625rem] bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-2xs cursor-pointer"
                title="Open Daily Call Report"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600" />
                <span className="hidden sm:inline">DCR Export</span>
                <span className="sm:hidden">DCR</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => navigate('/rep/profile')}
              className="w-8 h-8 rounded-[0.625rem] bg-navy-900 text-white font-display font-bold text-xs flex items-center justify-center shadow-xs hover:bg-navy-800 transition-colors cursor-pointer"
              title="My Profile"
            >
              {(userData?.name || 'R').charAt(0).toUpperCase()}
            </button>
          </div>

        </div>
      </header>

      {/* Slide-out Menu Drawer */}
      <RepDrawerMenu
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        repProfile={repProfile}
        userData={userData}
      />
    </>
  );
}
