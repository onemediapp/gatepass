import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, ClipboardList, User } from 'lucide-react';
import { cn } from '../../lib/utils';

export function RepBottomNav() {
  const links = [
    { to: '/rep/home', icon: Home, label: 'Home' },
    { to: '/rep/search', icon: Search, label: 'Search' },
    { to: '/rep/history', icon: ClipboardList, label: 'Requests' },
    { to: '/rep/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav
      aria-label="Rep Navigation"
      className="fixed bottom-0 left-0 right-0 bg-white/85 backdrop-blur-xl border-t border-line/80 pb-safe z-50 shadow-[0_-8px_24px_rgba(15,23,42,0.06)]"
    >
      <div className="max-w-md mx-auto flex justify-around items-center px-4 py-2">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  "relative flex flex-col items-center justify-center w-16 h-12 rounded-[1rem] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 active:scale-95",
                  isActive
                    ? "text-navy-950 font-bold"
                    : "text-slate-400 hover:text-slate-600"
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute inset-0 bg-navy-100/70 rounded-[1rem] -z-10 shadow-sm" />
                  )}
                  <Icon
                    className={cn(
                      "w-5 h-5 transition-transform duration-200",
                      isActive ? "scale-110 stroke-[2.35] text-navy-900" : "stroke-[1.8]"
                    )}
                  />
                  <span className={cn(
                    "text-[0.6875rem] mt-0.5 tracking-tight font-sans transition-colors",
                    isActive ? "text-navy-900 font-bold" : "text-slate-500 font-medium"
                  )}>
                    {link.label}
                  </span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 absolute bottom-0.5 shadow-[0_0_6px_rgba(245,158,11,0.6)]" />
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
