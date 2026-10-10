import { useState, useEffect } from 'react';
import { getDoctor, updateDoctor } from '../../lib/db/doctors';
import { useAuth } from '../../lib/auth';
import { handleFirestoreError, OperationType } from '../../utils/firebaseErrors';
import { ToggleSwitch } from '../../components/ui/ToggleSwitch';

export default function DoctorSettings() {
  const { user } = useAuth();
  const [privacy, setPrivacy] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
       if (!user) return;
       try {
         const dr = await getDoctor(user.uid);
         if (dr) {
            setPrivacy(dr.privacy || {});
         }
       } catch (error) {}
       setLoading(false);
    }
    load();
  }, [user]);

  const updatePrivacy = async (field, value) => {
     const newPrivacy = { ...privacy, [field]: value };
     setPrivacy(newPrivacy);
     try {
       await updateDoctor(user.uid, {
         privacy: newPrivacy
       });
     } catch (error) {
       handleFirestoreError(error, OperationType.UPDATE, 'doctors');
     }
  };

  if (loading || !privacy) return <div className="text-gray-500 font-medium font-sans flex items-center gap-2 p-4">Loading settings...</div>;

  return (
    <div className="pb-10 max-w-2xl mx-auto font-sans">
       <div className="mb-8">
         <h1 className="text-3xl font-display font-black text-premium-900 tracking-tight leading-tight">Privacy Settings</h1>
         <p className="text-gray-500 font-medium mt-2">Control your visibility and interactions.</p>
       </div>

       <div className="space-y-6">
          <section>
             <h2 className="font-bold text-gray-400 mb-3 text-[11px] uppercase tracking-widest pl-2">Search Visibility</h2>
             <div className="bg-white rounded-[1.5rem] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 overflow-hidden divide-y divide-gray-100/60">
                <div className="px-6 py-5 hover:bg-gray-50/50 transition-colors">
                  <ToggleSwitch 
                    label="Visible in Search" 
                    description="Reps can find you in search results"
                    checked={privacy.visibleInSearch}
                    onChange={(v) => updatePrivacy('visibleInSearch', v)}
                  />
                </div>
                <div className="px-6 py-5 bg-gray-50/30 hover:bg-gray-50 transition-colors">
                  <ToggleSwitch 
                    label="Show Full Name" 
                    description="If off, you appear as Dr. [Specialty]"
                    checked={privacy.showFullName}
                    onChange={(v) => updatePrivacy('showFullName', v)}
                  />
                </div>
             </div>
          </section>

          <section>
             <h2 className="font-bold text-gray-400 mb-3 text-[11px] uppercase tracking-widest pl-2">Appointments</h2>
             <div className="bg-white rounded-[1.5rem] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 overflow-hidden divide-y divide-gray-100/60">
                <div className="px-6 py-5 hover:bg-gray-50/50 transition-colors">
                  <ToggleSwitch 
                    label="Accept Appointment Requests" 
                    description="Allow reps to send you Gatepass requests"
                    checked={privacy.allowAppointmentRequest}
                    onChange={(v) => updatePrivacy('allowAppointmentRequest', v)}
                  />
                </div>
                <div className="px-6 py-5 bg-gray-50/30 hover:bg-gray-50 transition-colors">
                  <ToggleSwitch 
                    label="Auto-Approve Preferred Reps" 
                    description="Reps you star skip the waiting list"
                    checked={privacy.autoApprovePreferred}
                    onChange={(v) => updatePrivacy('autoApprovePreferred', v)}
                  />
                </div>
             </div>
          </section>

          <section>
             <h2 className="font-bold text-gray-400 mb-3 text-[11px] uppercase tracking-widest pl-2">Contact & WhatsApp</h2>
             <div className="bg-white rounded-[1.5rem] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 hover:bg-gray-50/50 transition-colors">
                  <ToggleSwitch 
                    label="Allow WhatsApp Contact" 
                    description="Pre-filled button for reps to reach you securely"
                    checked={privacy.allowWhatsAppRedirect}
                    onChange={(v) => updatePrivacy('allowWhatsAppRedirect', v)}
                  />
                </div>
             </div>
          </section>
       </div>
    </div>
  );
}
