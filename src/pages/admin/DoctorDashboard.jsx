import { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, LayoutDashboard, Users, Settings as SettingsIcon, Menu, X, QrCode, User, CheckCircle, Clock, XCircle, Building2 } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { logout } from '../../lib/firebase';
import { cn } from '../../lib/utils';
import DoctorHome from './DoctorHome';
import DoctorPendingRequests from './DoctorPendingRequests';
import DoctorApprovedRequests from './DoctorApprovedRequests';
import DoctorRejectedRequests from './DoctorRejectedRequests';
import DoctorReps from './DoctorReps';
import DoctorProfileEdit from './DoctorProfileEdit';
import DoctorSettings from './DoctorSettings';
import DoctorClinics from './DoctorClinics';
import DoctorProfileLinks from './DoctorProfileLinks';
import DoctorShifts from './DoctorShifts';
import ReceptionDesk from '../ReceptionDesk';

export default function DoctorDashboard() {
  const { userData, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { to: '/admin/desk', icon: Building2, label: 'Reception Desk', exact: true },
    { to: '/admin/pending', icon: Clock, label: 'Pending', exact: true },
    { to: '/admin/approved', icon: CheckCircle, label: 'Approved', exact: true },
    { to: '/admin/rejected', icon: XCircle, label: 'Rejected', exact: true },
    { to: '/admin/reps', icon: Users, label: 'My Reps', exact: false },
    { to: '/admin/edit-profile', icon: User, label: 'Edit Profile', exact: true },
    { to: '/admin/profile', icon: QrCode, label: 'Profile Links', exact: false },
    { to: '/admin/shifts', icon: Clock, label: 'Shift Manager', exact: true },
    { to: '/admin/clinics', icon: Building2, label: 'Clinics', exact: true },
    { to: '/admin/settings', icon: SettingsIcon, label: 'Settings', exact: false },
  ];

  return (
    <div className="min-h-screen bg-premium-50 font-sans md:flex selection:bg-emerald-100 relative">
      {/* Immersive Premium Light Background for Desktop */}
      <div className="hidden md:block absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-100/30 blur-[120px]"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] mix-blend-overlay"></div>
      </div>

      {/* Mobile Top Bar */}
      <div className="md:hidden bg-white/80 backdrop-blur-2xl border-b border-gray-100 px-5 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 rounded-[0.75rem] bg-premium-900 flex items-center justify-center font-display font-black text-white shadow-sm">G</div>
           <span className="font-display font-bold text-premium-900 tracking-tight text-lg">Gatepass</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleLogout} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors" title="Sign Out">
            <LogOut className="w-5 h-5" />
          </button>
          <button onClick={() => setSidebarOpen(true)} className="p-2 -mr-2 text-gray-500 hover:text-premium-900 rounded-xl transition-colors hover:bg-premium-50">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 bg-premium-900/40 backdrop-blur-md z-40 animate-in fade-in duration-300" onClick={() => setSidebarOpen(false)}></div>
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-[280px] bg-white/90 backdrop-blur-2xl border-r border-gray-100 z-50 transform transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] md:relative md:translate-x-0 flex flex-col shadow-[10px_0_40px_rgb(0,0,0,0.03)] md:shadow-none md:bg-white/60 md:border-white/80",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex items-center justify-between">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-[1rem] bg-premium-900 flex items-center justify-center text-white font-display font-black text-xl shadow-[0_4px_14px_rgba(15,23,42,0.2)]">G</div>
             <span className="font-display font-bold text-2xl tracking-tight text-premium-900">Gatepass</span>
           </div>
           <button onClick={() => setSidebarOpen(false)} className="md:hidden p-2 text-gray-400 hover:text-premium-900 rounded-[1rem] hover:bg-premium-50 transition-colors">
             <X className="w-5 h-5" />
           </button>
        </div>
        
        <div className="px-6 py-5 flex items-center gap-4">
           <div className="w-12 h-12 rounded-[1.25rem] bg-premium-50 border border-gray-100 text-emerald-600 flex items-center justify-center font-display font-bold text-xl shadow-sm">
             {userData?.name?.charAt(0)}
           </div>
           <div className="flex-1 min-w-0">
             <p className="font-display font-bold text-premium-900 truncate">Dr. {userData?.name?.split(' ')[0]}</p>
             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 truncate">Active Profile</p>
           </div>
        </div>

        <nav className="p-4 flex-1 space-y-1.5 mt-2 overflow-y-auto">
           {navItems.map(item => {
             const Icon = item.icon;
             const isActive = item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to);
             return (
               <NavLink
                 key={item.to}
                 to={item.to}
                 onClick={() => setSidebarOpen(false)}
                 className={cn(
                   "flex items-center gap-3.5 px-4 py-3 rounded-[1rem] font-medium transition-all relative overflow-hidden group text-[14px]",
                   isActive 
                    ? "bg-premium-900 text-white shadow-[0_4px_14px_rgba(15,23,42,0.15)] font-semibold" 
                    : "text-gray-500 hover:bg-premium-50 hover:text-premium-900"
                 )}
               >
                 <Icon className={cn("w-5 h-5", isActive ? "text-white" : "text-gray-400 group-hover:text-gray-600 transition-colors")} />
                 {item.label}
               </NavLink>
             );
           })}
        </nav>

        <div className="p-4 border-t border-gray-100/50">
           <button 
             onClick={handleLogout}
             className="flex items-center gap-3.5 px-4 py-3 rounded-[1rem] font-medium text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors w-full group text-[14px]"
           >
             <LogOut className="w-5 h-5 text-red-400 group-hover:text-red-500" />
             Sign Out
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto p-5 sm:p-10 h-[100dvh] overflow-y-auto relative z-10 scroll-smooth">
         <Routes>
            <Route path="/" element={<DoctorHome />} />
            <Route path="/desk" element={<ReceptionDesk />} />
            <Route path="/pending" element={<DoctorPendingRequests />} />
            <Route path="/approved" element={<DoctorApprovedRequests />} />
            <Route path="/rejected" element={<DoctorRejectedRequests />} />
            <Route path="/reps" element={<DoctorReps />} />
            <Route path="/edit-profile" element={<DoctorProfileEdit />} />
            <Route path="/profile" element={<DoctorProfileLinks />} />
            <Route path="/shifts" element={<DoctorShifts />} />
            <Route path="/clinics" element={<DoctorClinics />} />
            <Route path="/settings" element={<DoctorSettings />} />
         </Routes>
      </main>
    </div>
  );
}
