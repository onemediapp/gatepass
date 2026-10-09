import { NavLink } from 'react-router-dom';
import { Home, Search, CalendarClock, User } from 'lucide-react';
import { cn } from '../../lib/utils';

export function RepBottomNav() {
  const links = [
    { to: '/rep/home', icon: Home, label: 'Home' },
    { to: '/rep/search', icon: Search, label: 'Discover' },
    { to: '/rep/history', icon: CalendarClock, label: 'Visits' },
    { to: '/rep/profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-2xl border-t border-gray-100 pb-safe z-50 shadow-[0_-4px_40px_rgb(0,0,0,0.03)]">
      <div className="max-w-md mx-auto flex justify-around items-center px-2 py-2">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => 
                cn(
                  "relative flex flex-col items-center justify-center w-16 h-12 transition-all duration-300",
                  isActive ? "text-premium-900" : "text-gray-400 hover:text-gray-600"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className={cn(
                    "absolute inset-0 bg-premium-50/0 rounded-xl transition-all duration-300",
                    isActive && "bg-premium-50 border border-gray-100 scale-100 scale-y-110 shadow-sm"
                  )}></div>
                  <Icon className={cn("w-6 h-6 relative z-10 transition-transform duration-300", isActive && "scale-110")} strokeWidth={isActive ? 2.5 : 2} />
                  <span className={cn(
                     "text-[10px] font-bold mt-1 relative z-10 transition-opacity duration-300",
                     isActive ? "opacity-100" : "opacity-0 absolute -bottom-4"
                  )}>
                    {link.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}
