/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Clock, Calendar, Users, MoreHorizontal } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { subscribeDoctorPendingAppointments } from '../../lib/db/appointments';
import { cn } from '../../lib/utils';

export default function DoctorBottomNav({ onOpenMenu }) {
  const { user } = useAuth();
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeDoctorPendingAppointments(user.uid, (list) => {
      setPendingCount(list.length);
    });
    return () => unsub();
  }, [user]);

  const items = [
    {
      to: '/admin',
      label: 'Home',
      icon: Home,
      exact: true
    },
    {
      to: '/admin/pending',
      label: 'Requests',
      icon: Clock,
      badge: pendingCount
    },
    {
      to: '/admin/today',
      label: 'Visits',
      icon: Calendar
    },
    {
      to: '/admin/reps',
      label: 'Reps',
      icon: Users
    }
  ];

  return (
    <nav 
      aria-label="Doctor Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-line/90 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] px-2 py-1.5"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact 
            ? location.pathname === item.to || location.pathname === '/admin/home'
            : location.pathname.startsWith(item.to);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                "relative flex flex-col items-center justify-center py-1 px-3 rounded-[0.75rem] transition-all duration-150 min-w-[3.75rem]",
                isActive ? "text-teal-700 font-bold" : "text-slate-400 hover:text-slate-600 font-medium"
              )}
            >
              <div className="relative">
                <Icon className={cn("w-5 h-5 transition-transform", isActive ? "scale-110 text-teal-600" : "")} />
                {item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[1rem] h-4 px-1 rounded-full bg-coral-500 text-white font-mono text-[0.5625rem] font-bold flex items-center justify-center shadow-xs animate-pulse">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[0.625rem] mt-1 tracking-tight">
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-4 h-0.5 rounded-full bg-teal-600" />
              )}
            </NavLink>
          );
        })}

        {/* More Button */}
        <button
          type="button"
          onClick={onOpenMenu}
          className="relative flex flex-col items-center justify-center py-1 px-3 rounded-[0.75rem] text-slate-400 hover:text-slate-600 font-medium min-w-[3.75rem]"
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[0.625rem] mt-1 tracking-tight">More</span>
        </button>
      </div>
    </nav>
  );
}
