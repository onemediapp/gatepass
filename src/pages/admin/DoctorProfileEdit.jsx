import React, { useState, useEffect } from 'react';
import { getDoctor, updateDoctor } from '../../lib/db/doctors';
import { updateUser } from '../../lib/db/users';
import { getDoctorContact, setDoctorContact } from '../../lib/db/doctorContacts';
import { useAuth } from '../../lib/auth';
import { handleFirestoreError, OperationType } from '../../utils/firebaseErrors';
import { Check } from 'lucide-react';
import EdgeCard from '../../components/ui/EdgeCard';
import Skeleton from '../../components/ui/Skeleton';
import PhoneInput from '../../components/ui/PhoneInput';

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
      } catch (error) {
        console.error(error);
      }
      setLoading(false);
    }
    loadData();
  }, [user, userData]);

  const updateForm = (key, val) => setFormData(p => ({ ...p, [key]: val }));

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
      console.error('Doctor profile update failed:', err);
      alert('Failed to update profile: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  if (loading || !formData) {
    return (
      <div className="pb-10 max-w-2xl mx-auto space-y-4 font-sans">
        <Skeleton className="w-48 h-8 rounded-[0.75rem]" />
        <Skeleton className="w-full h-80 rounded-[1.25rem]" />
      </div>
    );
  }

  return (
    <div className="pb-10 max-w-2xl mx-auto font-sans selection:bg-amber-100 selection:text-sand-600">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-ink tracking-tight">Doctor Profile</h1>
        <p className="text-ink-soft text-xs mt-0.5">Update credentials and public details displayed to reps.</p>
      </div>

      <div className="space-y-5">
        <EdgeCard edge="navy" className="p-5 flex flex-col gap-4">
          <div className="space-y-1">
            <label className="font-mono text-xs uppercase tracking-wider text-ink-mute font-semibold px-0.5">Full Name</label>
            <input 
              type="text" 
              className="w-full border border-line rounded-[0.875rem] px-3.5 py-2.5 focus:ring-2 focus:ring-navy-100 focus:border-navy-500 bg-cream-50 outline-none font-medium text-ink placeholder:text-ink-mute text-xs transition-all"
              value={formData.name || ''}
              onChange={(e) => updateForm('name', e.target.value)}
              placeholder="e.g. Dr. T. Karthik"
            />
          </div>
          
          <div className="space-y-1">
            <label className="font-mono text-xs uppercase tracking-wider text-ink-mute font-semibold px-0.5">Specialty</label>
            <input 
              type="text" 
              className="w-full border border-line rounded-[0.875rem] px-3.5 py-2.5 focus:ring-2 focus:ring-navy-100 focus:border-navy-500 bg-cream-50 outline-none font-medium text-ink placeholder:text-ink-mute text-xs transition-all"
              value={formData.specialty || ''}
              onChange={(e) => updateForm('specialty', e.target.value)}
              placeholder="e.g. Physician"
            />
          </div>
          
          <div className="space-y-1">
            <label className="font-mono text-xs uppercase tracking-wider text-ink-mute font-semibold px-0.5">Qualifications</label>
            <input 
              type="text" 
              className="w-full border border-line rounded-[0.875rem] px-3.5 py-2.5 focus:ring-2 focus:ring-navy-100 focus:border-navy-500 bg-cream-50 outline-none font-medium text-ink placeholder:text-ink-mute text-xs transition-all"
              value={formData.qualifications || ''}
              onChange={(e) => updateForm('qualifications', e.target.value)}
              placeholder="e.g. MBBS, MD"
            />
          </div>

          <div className="space-y-1">
            <label className="font-mono text-xs uppercase tracking-wider text-ink-mute font-semibold px-0.5">
              Private WhatsApp (+91)
            </label>
            <PhoneInput 
              value={formData.whatsappNumber || ''}
              onChange={(val) => updateForm('whatsappNumber', val)}
            />
            <p className="text-[0.6875rem] text-ink-mute px-0.5">
              Only shared with medical representatives whose requests you explicitly approve.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-mono text-xs uppercase tracking-wider text-ink-mute font-semibold px-0.5">City</label>
              <input 
                type="text" 
                className="w-full border border-line rounded-[0.875rem] px-3.5 py-2.5 focus:ring-2 focus:ring-navy-100 focus:border-navy-500 bg-cream-50 outline-none font-medium text-ink placeholder:text-ink-mute text-xs transition-all"
                value={formData.city || ''}
                onChange={(e) => updateForm('city', e.target.value)}
                placeholder="Kurnool"
              />
            </div>
            <div className="space-y-1">
              <label className="font-mono text-xs uppercase tracking-wider text-ink-mute font-semibold px-0.5">State</label>
              <input 
                type="text" 
                className="w-full border border-line rounded-[0.875rem] px-3.5 py-2.5 focus:ring-2 focus:ring-navy-100 focus:border-navy-500 bg-cream-50 outline-none font-medium text-ink placeholder:text-ink-mute text-xs transition-all"
                value={formData.state || ''}
                onChange={(e) => updateForm('state', e.target.value)}
                placeholder="Andhra Pradesh"
              />
            </div>
          </div>
        </EdgeCard>
        
        <button 
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-navy-900 text-white font-bold rounded-[0.875rem] px-5 py-3 hover:bg-navy-700 transition-all active:scale-[0.99] flex items-center justify-center gap-2 shadow-sm text-xs disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Profile Changes'} <Check className="w-4 h-4 text-amber-500" />
        </button>
      </div>
    </div>
  );
}
