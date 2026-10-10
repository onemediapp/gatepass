import { useState, useEffect } from 'react';
import { getDoctor, updateDoctor } from '../../lib/db/doctors';
import { updateUser } from '../../lib/db/users';
import { getDoctorContact, setDoctorContact } from '../../lib/db/doctorContacts';
import { useAuth } from '../../lib/auth';
import { handleFirestoreError, OperationType } from '../../utils/firebaseErrors';
import { Check } from 'lucide-react';

export default function DoctorProfileEdit() {
  const { user, userData, setUserData } = useAuth();
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
       if (!user) return;
       try {
         const dr = await getDoctor(user.uid);
         const contact = await getDoctorContact(user.uid);
         if (dr) {
            setFormData({
              ...dr,
              name: userData?.name || dr.name || '',
              whatsappNumber: contact?.whatsappNumber || ''
            });
         }
       } catch (error) {}
       setLoading(false);
    }
    loadData();
  }, [user, userData]);

  const updateForm = (key, val) => setFormData(p => ({...p, [key]: val}));

  const handleSave = async () => {
    if (!formData) return;
    setSaving(true);
    try {
      await updateDoctor(user.uid, {
        name: formData.name,
        specialty: formData.specialty,
        qualifications: formData.qualifications,
        city: formData.city,
        state: formData.state
      });
      await updateUser(user.uid, {
        name: formData.name
      });
      if (formData.whatsappNumber) {
        await setDoctorContact(user.uid, {
          whatsappNumber: formData.whatsappNumber
        });
      }
      if (setUserData) {
        setUserData(prev => ({ ...prev, name: formData.name }));
      }
      alert('Profile updated successfully');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'doctors/users');
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !formData) return <div className="text-gray-500 font-medium font-sans flex items-center gap-2 p-4">Loading profile...</div>;

  return (
    <div className="pb-10 max-w-2xl mx-auto font-sans">
       <div className="mb-8">
         <h1 className="text-3xl font-display font-black text-premium-900 tracking-tight leading-tight">Edit Profile</h1>
         <p className="text-gray-500 font-medium mt-2">Update your professional details.</p>
       </div>

       <div className="space-y-6">
          <div className="bg-white rounded-[1.5rem] p-6 sm:p-8 shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-gray-100 flex flex-col gap-6">
             <div className="space-y-2">
               <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Full Name</label>
               <input 
                 type="text" 
                 className="w-full border border-gray-200 rounded-[1rem] px-5 py-4 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white shadow-sm outline-none font-medium text-premium-900 placeholder:text-gray-400 transition-all text-[15px]"
                 value={formData.name || ''}
                 onChange={(e) => updateForm('name', e.target.value)}
                 placeholder="e.g. Dr. Jane Doe"
               />
             </div>
             
             <div className="space-y-2">
               <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Specialty</label>
               <input 
                 type="text" 
                 className="w-full border border-gray-200 rounded-[1rem] px-5 py-4 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white shadow-sm outline-none font-medium text-premium-900 placeholder:text-gray-400 transition-all text-[15px]"
                 value={formData.specialty || ''}
                 onChange={(e) => updateForm('specialty', e.target.value)}
               />
             </div>
             
             <div className="space-y-2">
               <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Qualifications</label>
               <input 
                 type="text" 
                 className="w-full border border-gray-200 rounded-[1rem] px-5 py-4 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white shadow-sm outline-none font-medium text-premium-900 placeholder:text-gray-400 transition-all text-[15px]"
                 value={formData.qualifications || ''}
                 onChange={(e) => updateForm('qualifications', e.target.value)}
                 placeholder="e.g. MBBS, MD"
               />
             </div>

             <div className="space-y-2">
               <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">WhatsApp Number</label>
               <input 
                 type="text" 
                 className="w-full border border-gray-200 rounded-[1rem] px-5 py-4 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white shadow-sm outline-none font-medium text-premium-900 placeholder:text-gray-400 transition-all text-[15px]"
                 value={formData.whatsappNumber || ''}
                 onChange={(e) => updateForm('whatsappNumber', e.target.value)}
                 placeholder="+91..."
               />
             </div>

             <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">City</label>
                   <input 
                     type="text" 
                     className="w-full border border-gray-200 rounded-[1rem] px-5 py-4 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white shadow-sm outline-none font-medium text-premium-900 placeholder:text-gray-400 transition-all text-[15px]"
                     value={formData.city || ''}
                     onChange={(e) => updateForm('city', e.target.value)}
                   />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">State</label>
                   <input 
                     type="text" 
                     className="w-full border border-gray-200 rounded-[1rem] px-5 py-4 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white shadow-sm outline-none font-medium text-premium-900 placeholder:text-gray-400 transition-all text-[15px]"
                     value={formData.state || ''}
                     onChange={(e) => updateForm('state', e.target.value)}
                   />
                 </div>
             </div>
          </div>
          
          <button 
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-premium-900 text-white font-bold rounded-[1.25rem] px-6 py-4 hover:bg-black transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(15,23,42,0.2)] text-[15px] disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Profile'} <Check className="w-5 h-5" />
          </button>
       </div>
    </div>
  );
}
