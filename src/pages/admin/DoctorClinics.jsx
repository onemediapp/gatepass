import React, { useState, useEffect } from 'react';
import { listClinicsByDoctor, createClinic, updateClinic } from '../../lib/db/clinics';
import { linkDoctorClinic } from '../../lib/db/doctorClinics';
import { getDoctor, updateDoctor } from '../../lib/db/doctors';
import { useAuth } from '../../lib/auth';
import { 
  Building2, 
  Plus, 
  Edit2, 
  X, 
  Check, 
  MapPin, 
  Phone, 
  Clock, 
  Monitor, 
  ExternalLink, 
  Copy, 
  Sparkles,
  KeyRound 
} from 'lucide-react';
import { handleFirestoreError, OperationType } from '../../utils/firebaseErrors';
import EdgeCard from '../../components/ui/EdgeCard';
import Skeleton from '../../components/ui/Skeleton';
import MonoTag from '../../components/ui/MonoTag';

export default function DoctorClinics() {
  const { user } = useAuth();
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingClinic, setEditingClinic] = useState(null);
  const [copiedSlug, setCopiedSlug] = useState(null);
  
  const [formData, setFormData] = useState({
    clinicName: '',
    address: '',
    city: '',
    state: '',
    phone: '',
    repHours: '',
    staffPin: '2026'
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
    setFormData({ clinicName: '', address: '', city: '', state: '', phone: '', repHours: '', staffPin: '2026' });
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
      repHours: clinic.repHours || '',
      staffPin: clinic.staffPin || '2026'
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
          repHours: formData.repHours,
          staffPin: formData.staffPin || '2026'
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
          staffPin: formData.staffPin || '2026',
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

  if (loading) {
    return (
      <div className="pb-10 max-w-4xl mx-auto space-y-4 font-sans">
        <Skeleton className="w-48 h-8 rounded-[0.75rem]" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-40 rounded-[1.25rem]" />
          <Skeleton className="h-40 rounded-[1.25rem]" />
        </div>
      </div>
    );
  }

  return (
    <div className="pb-10 max-w-4xl mx-auto font-sans selection:bg-amber-100 selection:text-sand-600">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink tracking-tight">Practice Locations</h1>
          <p className="text-ink-soft text-xs mt-0.5">Manage clinics where medical representatives can visit you.</p>
        </div>
        <button 
          onClick={handleOpenNew}
          className="bg-navy-900 text-white px-4 py-2.5 rounded-[0.875rem] font-bold text-xs flex items-center gap-1.5 shadow-sm hover:bg-navy-700 transition-all active:scale-[0.99]"
        >
          <Plus className="w-4 h-4 text-amber-500" /> Add Clinic
        </button>
      </div>

      {clinics.length === 0 ? (
        <div className="text-center py-12 text-ink-mute font-medium bg-white rounded-[1.25rem] border border-line border-dashed text-xs">
          You haven't set up any clinics yet. Click "Add Clinic" to get started.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {clinics.map(clinic => (
            <EdgeCard key={clinic.id} edge="teal" className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-[0.75rem] flex items-center justify-center border border-teal-600/20">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <button 
                    onClick={() => handleOpenEdit(clinic)}
                    className="p-1.5 text-ink-mute hover:text-navy-900 hover:bg-cream-50 rounded-[0.5rem] transition-all"
                    title="Edit clinic"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <h2 className="text-base font-display font-bold text-ink mb-1">{clinic.clinicName}</h2>
                <p className="text-ink-soft text-xs flex items-start gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <span>{clinic.address}, {clinic.city}, {clinic.state}</span>
                </p>
              </div>
              
              <div className="mt-4 pt-3 border-t border-line space-y-2">
                {clinic.phone && (
                  <div className="flex items-center gap-1.5 text-xs text-ink-soft">
                    <Phone className="w-3 h-3 text-ink-mute" />
                    <span className="font-mono text-[0.6875rem]">{clinic.phone}</span>
                  </div>
                )}
                {clinic.repHours && (
                  <div className="flex items-center gap-1.5 text-xs text-ink-soft">
                    <Clock className="w-3 h-3 text-ink-mute" />
                    <span className="font-mono text-[0.6875rem]">MR Hours: {clinic.repHours}</span>
                  </div>
                )}

                {/* Reception Kiosk & Staff Delegation Box */}
                <div className="mt-3 p-3 rounded-[0.875rem] bg-cream-100/70 border border-line/80 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Monitor className="w-3.5 h-3.5 text-sand-600" />
                      <span className="font-bold text-xs text-ink">Reception Desk Kiosk</span>
                    </div>
                    <span className="font-mono text-[0.625rem] bg-navy-900 text-amber-400 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <KeyRound className="w-2.5 h-2.5" /> PIN: {clinic.staffPin || '2026'}
                    </span>
                  </div>
                  <p className="text-[0.6875rem] text-ink-soft">
                    Counter tablet mode for clinic receptionists to manage arriving reps without doctor account login.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <a
                      href={`/kiosk/${clinic.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-1.5 px-3 bg-navy-900 text-white rounded-[0.625rem] text-xs font-bold hover:bg-navy-800 transition-colors flex items-center justify-center gap-1.5 text-center"
                    >
                      <span>Open Kiosk</span>
                      <ExternalLink className="w-3 h-3 text-amber-400" />
                    </a>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/kiosk/${clinic.slug}`);
                        setCopiedSlug(clinic.slug);
                        setTimeout(() => setCopiedSlug(null), 2000);
                      }}
                      className="px-2.5 py-1.5 border border-line rounded-[0.625rem] text-xs font-medium text-ink-soft hover:bg-white transition-colors flex items-center gap-1"
                      title="Copy Kiosk URL"
                    >
                      {copiedSlug === clinic.slug ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSlug === clinic.slug ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </EdgeCard>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-navy-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[1.75rem] w-full max-w-lg shadow-[0_20px_60px_rgba(11,23,48,0.2)] overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-line flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10">
              <h2 className="text-lg font-display font-bold text-ink">
                {editingClinic ? 'Edit Clinic' : 'Add New Clinic'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-ink-mute hover:text-ink hover:bg-cream-50 rounded-[0.5rem] transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto space-y-4">
              <div className="space-y-1">
                <label className="font-mono text-xs uppercase tracking-wider text-ink-mute font-semibold px-0.5">Clinic Name *</label>
                <input 
                  type="text" 
                  value={formData.clinicName}
                  onChange={e => setFormData({...formData, clinicName: e.target.value})}
                  className="w-full border border-line rounded-[0.875rem] px-3.5 py-2.5 focus:ring-2 focus:ring-navy-100 focus:border-navy-500 bg-cream-50 outline-none font-medium text-ink placeholder:text-ink-mute text-xs transition-all"
                  placeholder="e.g. Remedi Clinic"
                />
              </div>
              
              <div className="space-y-1">
                <label className="font-mono text-xs uppercase tracking-wider text-ink-mute font-semibold px-0.5">Address *</label>
                <input 
                  type="text" 
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  className="w-full border border-line rounded-[0.875rem] px-3.5 py-2.5 focus:ring-2 focus:ring-navy-100 focus:border-navy-500 bg-cream-50 outline-none font-medium text-ink placeholder:text-ink-mute text-xs transition-all"
                  placeholder="e.g. Gayatri Estates, Kurnool"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-mono text-xs uppercase tracking-wider text-ink-mute font-semibold px-0.5">City</label>
                  <input 
                    type="text" 
                    value={formData.city}
                    onChange={e => setFormData({...formData, city: e.target.value})}
                    className="w-full border border-line rounded-[0.875rem] px-3.5 py-2.5 focus:ring-2 focus:ring-navy-100 focus:border-navy-500 bg-cream-50 outline-none font-medium text-ink placeholder:text-ink-mute text-xs transition-all"
                    placeholder="Kurnool"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-xs uppercase tracking-wider text-ink-mute font-semibold px-0.5">State</label>
                  <input 
                    type="text" 
                    value={formData.state}
                    onChange={e => setFormData({...formData, state: e.target.value})}
                    className="w-full border border-line rounded-[0.875rem] px-3.5 py-2.5 focus:ring-2 focus:ring-navy-100 focus:border-navy-500 bg-cream-50 outline-none font-medium text-ink placeholder:text-ink-mute text-xs transition-all"
                    placeholder="Andhra Pradesh"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-mono text-xs uppercase tracking-wider text-ink-mute font-semibold px-0.5">Phone Number</label>
                <input 
                  type="tel" 
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full border border-line rounded-[0.875rem] px-3.5 py-2.5 focus:ring-2 focus:ring-navy-100 focus:border-navy-500 bg-cream-50 outline-none font-medium text-ink placeholder:text-ink-mute text-xs transition-all"
                  placeholder="08518-..."
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono text-xs uppercase tracking-wider text-ink-mute font-semibold px-0.5">MR Meeting Hours</label>
                <input 
                  type="text" 
                  placeholder="e.g. Mon, Wed, Fri 2PM-4PM"
                  value={formData.repHours}
                  onChange={e => setFormData({...formData, repHours: e.target.value})}
                  className="w-full border border-line rounded-[0.875rem] px-3.5 py-2.5 focus:ring-2 focus:ring-navy-100 focus:border-navy-500 bg-cream-50 outline-none font-medium text-ink placeholder:text-ink-mute text-xs transition-all"
                />
              </div>

              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between">
                  <label className="font-mono text-xs uppercase tracking-wider text-ink-mute font-semibold px-0.5">Staff Reception PIN</label>
                  <span className="text-[0.625rem] font-mono text-sand-600 font-bold">Default: 2026</span>
                </div>
                <input 
                  type="text" 
                  maxLength={6}
                  placeholder="2026"
                  value={formData.staffPin}
                  onChange={e => setFormData({...formData, staffPin: e.target.value.replace(/\D/g, '')})}
                  className="w-full border border-line rounded-[0.875rem] px-3.5 py-2.5 focus:ring-2 focus:ring-navy-100 focus:border-navy-500 bg-cream-50 outline-none font-mono font-bold text-ink placeholder:text-ink-mute text-xs tracking-widest transition-all"
                />
                <p className="text-[0.625rem] text-ink-soft px-0.5">
                  Receptionists or front desk staff use this PIN on the counter tablet to manage arriving reps.
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-line bg-cream-50 mt-auto">
              <button 
                onClick={handleSave}
                disabled={saving || !formData.clinicName || !formData.address}
                className="w-full bg-navy-900 text-white font-bold rounded-[0.875rem] px-5 py-3 hover:bg-navy-700 transition-all active:scale-[0.99] flex items-center justify-center gap-2 shadow-sm text-xs disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Clinic'} <Check className="w-4 h-4 text-amber-500" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
