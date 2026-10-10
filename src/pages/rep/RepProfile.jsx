import { useState, useEffect } from 'react';
import { getRep, updateRep } from '../../lib/db/reps';
import { logout } from '../../lib/firebase';
import { useAuth } from '../../lib/auth';
import { Check, Edit2, LogOut, BriefcaseMedical } from 'lucide-react';
import { TagInput } from '../../components/ui/TagInput';
import { ToggleSwitch } from '../../components/ui/ToggleSwitch';
import { PhoneInput } from '../../components/ui/PhoneInput';
import { RepBottomNav } from '../../components/layout/RepBottomNav';

export default function RepProfile() {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(null);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const data = await getRep(user.uid);
        if (data) {
          setFormData(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const updateForm = (key, val) => setFormData(p => ({...p, [key]: val}));

  const handleSave = async () => {
    if (!formData) return;
    setSaving(true);
    try {
      await updateRep(user.uid, formData);
      alert('Profile updated successfully');
    } catch (err) {
      console.error(err);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div className="text-gray-400 font-medium p-4 font-sans text-center animate-pulse mt-10">Loading profile...</div>;
  if (!formData) return <div className="p-4 text-center mt-10 text-gray-500 font-medium">Error loading profile.</div>;

  return (
    <div className="pb-24 font-sans max-w-2xl mx-auto p-4 sm:p-6 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-700 selection:bg-emerald-100">
       <div className="mb-10 flex justify-between items-start">
         <div className="flex items-center gap-4">
           <div className="w-14 h-14 rounded-[1.25rem] bg-premium-900 flex items-center justify-center text-white shadow-sm flex-shrink-0">
             <span className="font-display font-black text-2xl">{userData?.name?.charAt(0) || 'R'}</span>
           </div>
           <div>
             <h1 className="text-3xl font-display font-black text-premium-900 tracking-tight leading-tight">My Profile</h1>
             <p className="text-gray-500 font-medium mt-0.5">{userData?.name || 'Medical Rep'}</p>
           </div>
         </div>
         <button 
           onClick={handleLogout}
           className="w-11 h-11 rounded-[1rem] bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 hover:text-red-600 transition-colors border border-red-100/50"
           title="Sign Out"
         >
           <LogOut className="w-5 h-5" />
         </button>
       </div>

       <div className="space-y-6">
          <div className="bg-white/80 backdrop-blur-xl rounded-[1.5rem] p-6 sm:p-8 shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 flex flex-col gap-7">
             <div className="space-y-2">
               <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Designation</label>
               <input 
                 type="text" 
                 className="w-full border border-gray-200 rounded-[1rem] px-5 py-3.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-premium-50 shadow-inner outline-none font-medium text-premium-900 placeholder:text-gray-400 transition-all text-sm"
                 value={formData.designation || ''}
                 onChange={(e) => updateForm('designation', e.target.value)}
                 placeholder="e.g. Senior Medical Representative"
               />
             </div>
             <div className="space-y-2">
               <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Mobile</label>
               <div className="bg-premium-50 rounded-[1rem] shadow-inner border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
                  <PhoneInput 
                    value={formData.mobile || ''}
                    onChange={(val) => updateForm('mobile', val)}
                  />
               </div>
             </div>
             
             <div className="pt-4 pb-2 border-t border-gray-100/60">
               <div className="flex items-center gap-2 mb-4">
                 <BriefcaseMedical className="w-4 h-4 text-emerald-500" />
                 <h3 className="font-bold text-premium-900">Portfolio</h3>
               </div>
               <div className="space-y-2">
                 <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Key Brands You Carry</label>
                 <div className="bg-premium-50 rounded-[1rem] border border-gray-200 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all p-1 shadow-inner">
                   <TagInput 
                     tags={formData.productNames || []}
                     onChange={(tags) => updateForm('productNames', tags)}
                     placeholder="Type brand name and press Enter..."
                   />
                 </div>
               </div>
             </div>
             
             <div className="bg-emerald-50/50 rounded-[1rem] p-4 border border-emerald-100/50">
               <ToggleSwitch 
                 label="Samples Available"
                 description="I usually carry product samples on my visits."
                 checked={formData.samplesAvailable || false}
                 onChange={(val) => updateForm('samplesAvailable', val)}
               />
             </div>
          </div>
          
          <button 
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-premium-900 text-white font-bold rounded-[1.25rem] px-6 py-4.5 hover:bg-black transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(15,23,42,0.2)] text-[15px] disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Profile Changes'} <Check className="w-5 h-5" />
          </button>
       </div>
       <RepBottomNav />
    </div>
  );
}
