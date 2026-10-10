import { useState, useEffect } from 'react';
import { listClinicsByDoctor, createClinic, updateClinic } from '../../lib/db/clinics';
import { linkDoctorClinic } from '../../lib/db/doctorClinics';
import { getDoctor, updateDoctor } from '../../lib/db/doctors';
import { useAuth } from '../../lib/auth';
import { Building2, Plus, Edit2, X, Check } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../../utils/firebaseErrors';

export default function DoctorClinics() {
  const { user } = useAuth();
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingClinic, setEditingClinic] = useState(null);
  
  const [formData, setFormData] = useState({
    clinicName: '',
    address: '',
    city: '',
    state: '',
    phone: '',
    repHours: ''
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadClinics();
  }, [user]);

  async function loadClinics() {
    if (!user) return;
    try {
      const data = await listClinicsByDoctor(user.uid);
      setClinics(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenNew = () => {
    setEditingClinic(null);
    setFormData({ clinicName: '', address: '', city: '', state: '', phone: '', repHours: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (clinic) => {
    setEditingClinic(clinic);
    setFormData({
      clinicName: clinic.clinicName || '',
      address: clinic.address || '',
      city: clinic.city || '',
      state: clinic.state || '',
      phone: clinic.phone || '',
      repHours: clinic.repHours || ''
    });
    setShowModal(true);
  };

  const generateSlug = (name) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Math.random().toString(36).substring(2, 7);
  };

  const handleSave = async () => {
    if (!formData.clinicName || !formData.address) return;
    setSaving(true);
    
    try {
      if (editingClinic) {
        await updateClinic(editingClinic.id, {
          clinicName: formData.clinicName,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          phone: formData.phone,
          repHours: formData.repHours
        });
      } else {
        const baseSlug = generateSlug(formData.clinicName);
        const newClinicId = await createClinic({
          clinicName: formData.clinicName,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          phone: formData.phone,
          repHours: formData.repHours,
          slug: baseSlug,
          ownerDoctorId: user.uid,
          qrCodeData: `${window.location.origin}/clinic/${baseSlug}`,
          isActive: true
        });

        await linkDoctorClinic(user.uid, newClinicId);

        const dr = await getDoctor(user.uid);
        if (dr) {
          const currentIds = dr.clinicIds || [];
          await updateDoctor(user.uid, {
            clinicIds: [...currentIds, newClinicId]
          });
        }
      }
      
      setShowModal(false);
      loadClinics();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'clinics');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-gray-500 font-medium font-sans flex items-center gap-2 p-4">Loading clinics...</div>;

  return (
    <div className="pb-10 max-w-4xl mx-auto font-sans">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-black text-premium-900 tracking-tight leading-tight">My Clinics</h1>
          <p className="text-gray-500 font-medium mt-2">Manage your practice locations.</p>
        </div>
        <button 
          onClick={handleOpenNew}
          className="bg-premium-900 text-white px-5 py-3 rounded-[1rem] font-bold text-[14px] flex items-center gap-2 shadow-[0_4px_14px_rgba(15,23,42,0.2)] hover:bg-black transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" /> Add Clinic
        </button>
      </div>

      {clinics.length === 0 ? (
         <div className="text-center py-16 text-gray-400 font-medium bg-white rounded-[1.5rem] border border-gray-100 border-dashed text-[15px]">
            You haven't set up any clinics yet. Click "Add Clinic" to get started.
         </div>
      ) : (
         <div className="grid gap-4 md:grid-cols-2">
            {clinics.map(clinic => (
              <div key={clinic.id} className="bg-white rounded-[1.5rem] shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-gray-100 p-6 flex flex-col group">
                 <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-[1rem] flex items-center justify-center border border-emerald-100/50">
                       <Building2 className="w-6 h-6" />
                    </div>
                    <button 
                      onClick={() => handleOpenEdit(clinic)}
                      className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                    >
                       <Edit2 className="w-4 h-4" />
                    </button>
                 </div>
                 <h2 className="text-[18px] font-display font-black text-premium-900 mb-1">{clinic.clinicName}</h2>
                 <p className="text-gray-500 font-medium text-[14px] line-clamp-2">{clinic.address}, {clinic.city}, {clinic.state}</p>
                 
                 <div className="mt-6 space-y-2">
                    {clinic.phone && <div className="text-[13px] font-bold text-gray-600">Tel: {clinic.phone}</div>}
                    {clinic.repHours && <div className="text-[13px] font-bold text-gray-600">MR Hours: {clinic.repHours}</div>}
                 </div>
              </div>
            ))}
         </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-premium-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-[0_20px_60px_rgb(0,0,0,0.1)] overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-300">
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-xl z-10">
                 <h2 className="text-xl font-display font-black text-premium-900 tracking-tight">{editingClinic ? 'Edit Clinic' : 'Add New Clinic'}</h2>
                 <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-premium-900 hover:bg-gray-100 rounded-xl transition-all active:scale-95">
                    <X className="w-5 h-5" />
                 </button>
              </div>
              
              <div className="p-6 overflow-y-auto space-y-5">
                 <div className="space-y-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Clinic Name *</label>
                    <input 
                      type="text" 
                      value={formData.clinicName}
                      onChange={e => setFormData({...formData, clinicName: e.target.value})}
                      className="w-full border border-gray-200 rounded-[1rem] px-4 py-3.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white shadow-sm outline-none font-medium text-premium-900 placeholder:text-gray-400 transition-all text-[15px]"
                    />
                 </div>
                 
                 <div className="space-y-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Address *</label>
                    <input 
                      type="text" 
                      value={formData.address}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                      className="w-full border border-gray-200 rounded-[1rem] px-4 py-3.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white shadow-sm outline-none font-medium text-premium-900 placeholder:text-gray-400 transition-all text-[15px]"
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">City</label>
                       <input 
                         type="text" 
                         value={formData.city}
                         onChange={e => setFormData({...formData, city: e.target.value})}
                         className="w-full border border-gray-200 rounded-[1rem] px-4 py-3.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white shadow-sm outline-none font-medium text-premium-900 placeholder:text-gray-400 transition-all text-[15px]"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">State</label>
                       <input 
                         type="text" 
                         value={formData.state}
                         onChange={e => setFormData({...formData, state: e.target.value})}
                         className="w-full border border-gray-200 rounded-[1rem] px-4 py-3.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white shadow-sm outline-none font-medium text-premium-900 placeholder:text-gray-400 transition-all text-[15px]"
                       />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Phone Number</label>
                    <input 
                      type="tel" 
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      className="w-full border border-gray-200 rounded-[1rem] px-4 py-3.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white shadow-sm outline-none font-medium text-premium-900 placeholder:text-gray-400 transition-all text-[15px]"
                    />
                 </div>

                 <div className="space-y-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">MR Meeting Hours</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Mon-Fri 2PM-4PM"
                      value={formData.repHours}
                      onChange={e => setFormData({...formData, repHours: e.target.value})}
                      className="w-full border border-gray-200 rounded-[1rem] px-4 py-3.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white shadow-sm outline-none font-medium text-premium-900 placeholder:text-gray-400 transition-all text-[15px]"
                    />
                 </div>
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50/50 mt-auto">
                 <button 
                   onClick={handleSave}
                   disabled={saving || !formData.clinicName || !formData.address}
                   className="w-full bg-premium-900 text-white font-bold rounded-[1.25rem] px-6 py-4 hover:bg-black transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(15,23,42,0.2)] text-[15px] disabled:opacity-50"
                 >
                   {saving ? 'Saving...' : 'Save Clinic'} <Check className="w-5 h-5" />
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
