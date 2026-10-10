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
      className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-line pb-safe z-50 shadow-[0_-4px_24px_rgba(11,23,48,0.05)]"
    >
      <div className="max-w-md mx-auto flex justify-around items-center px-3 py-2">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  "relative flex flex-col items-center justify-center w-16 h-12 rounded-[0.75rem] transition-all",
                  isActive
                    ? "text-navy-900 font-bold"
                    : "text-ink-mute hover:text-ink-soft"
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute inset-0 bg-navy-100 rounded-[0.75rem] -z-10" />
                  )}
                  <Icon
                    className={cn(
                      "w-5 h-5 transition-transform",
                      isActive ? "scale-105 stroke-[2.25]" : "stroke-[1.75]"
                    )}
                  />
                  <span className="text-[0.6875rem] mt-0.5 tracking-tight font-sans">
                    {link.label}
                  </span>
                  {isActive && (
                    <span className="w-1 h-1 rounded-full bg-amber-500 absolute bottom-1" />
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
