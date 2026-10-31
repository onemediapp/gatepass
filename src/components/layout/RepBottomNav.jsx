/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Stethoscope, Calendar, BellRing, User } from 'lucide-react';
import { cn } from '../../lib/utils';

export function RepBottomNav() {
  const links = [
    { to: '/rep/home', icon: Home, label: 'Home' },
    { to: '/rep/search', icon: Stethoscope, label: 'Find Doctors' },
    { to: '/rep/history', icon: Calendar, label: 'Appointments' },
    { to: '/rep/notices', icon: BellRing, label: 'Notices', badge: 3 },
    { to: '/rep/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav
      aria-label="Rep Navigation"
      className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-line pb-safe z-50 shadow-[0_-8px_24px_rgba(15,23,42,0.06)]"
    >
      <div className="max-w-md mx-auto flex justify-between items-center px-3 py-2">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  "relative flex flex-col items-center justify-center flex-1 py-1 rounded-[0.875rem] transition-all duration-200 active:scale-95",
                  isActive
                    ? "text-navy-950 font-bold"
                    : "text-slate-400 hover:text-slate-600"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <Icon
                      className={cn(
                        "w-5 h-5 transition-transform duration-200",
                        isActive ? "scale-110 text-navy-900" : "text-slate-400"
                      )}
                    />
                    {link.badge && !isActive && (
                      <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[0.5625rem] font-mono font-bold flex items-center justify-center border-2 border-white">
                        {link.badge}
                      </span>
                    )}
                  </div>
                  <span className={cn(
                    "text-[0.625rem] mt-0.5 tracking-tight font-sans transition-colors truncate max-w-[64px]",
                    isActive ? "text-navy-900 font-bold" : "text-slate-500 font-medium"
                  )}>
                    {link.label}
                  </span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-0.5 shadow-[0_0_6px_rgba(245,158,11,0.6)]" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

export default RepBottomNav;
