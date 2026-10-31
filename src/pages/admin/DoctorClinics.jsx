/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
  KeyRound,
  Users,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { handleFirestoreError, OperationType } from '../../utils/firebaseErrors';
import Skeleton from '../../components/ui/Skeleton';
import { cn } from '../../lib/utils';

const CLINIC_TYPES = ['Clinic', 'Hospital', 'Day Care', 'Other'];

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
    city: 'Kurnool',
    state: 'Andhra Pradesh',
    phone: '',
    clinicType: 'Clinic',
    mapLocation: '',
    kioskEnabled: true,
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
    setFormData({
      clinicName: '',
      address: '',
      city: 'Kurnool',
      state: 'Andhra Pradesh',
      phone: '',
      clinicType: 'Clinic',
      mapLocation: 'Gayathri Estates, Kurnool, Andhra Pradesh',
      kioskEnabled: true,
      staffPin: '2026'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (clinic) => {
    setEditingClinic(clinic);
    setFormData({
      clinicName: clinic.clinicName || '',
      address: clinic.address || '',
      city: clinic.city || 'Kurnool',
      state: clinic.state || 'Andhra Pradesh',
      phone: clinic.phone || '',
      clinicType: clinic.clinicType || 'Clinic',
      mapLocation: clinic.mapLocation || clinic.address || '',
      kioskEnabled: clinic.kioskEnabled !== false,
      staffPin: clinic.staffPin || '2026'
    });
    setShowModal(true);
  };

  const generateSlug = (name) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Math.random().toString(36).substring(2, 7);
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
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
          clinicType: formData.clinicType,
          mapLocation: formData.mapLocation,
          kioskEnabled: formData.kioskEnabled,
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
          clinicType: formData.clinicType,
          mapLocation: formData.mapLocation,
          kioskEnabled: formData.kioskEnabled,
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
          <Skeleton className="h-44 rounded-[1.25rem]" />
          <Skeleton className="h-44 rounded-[1.25rem]" />
        </div>
      </div>
    );
  }

  return (
    <div className="pb-10 max-w-4xl mx-auto font-sans selection:bg-amber-100 selection:text-sand-600 space-y-6">
      
      {/* ── Top Header (Reference Image 2 Screen 1) ──────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink tracking-tight">Clinic Locations</h1>
          <p className="text-ink-soft text-xs mt-0.5">Manage your clinic branches and visiting locations.</p>
        </div>
        <button 
          onClick={handleOpenNew}
          className="bg-navy-900 text-white px-4 py-2.5 rounded-[0.875rem] font-bold text-xs flex items-center gap-1.5 shadow-sm hover:bg-navy-800 transition-all active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>Add Clinic</span>
        </button>
      </div>

      {/* ── Clinics List ────────────────────────────────────────────── */}
      {clinics.length === 0 ? (
        <div className="text-center py-12 text-ink-mute font-medium bg-white rounded-[1.25rem] border border-line border-dashed text-xs">
          You haven't set up any clinics yet. Click "Add Clinic" to get started.
        </div>
      ) : (
        <div className="space-y-4">
          {clinics.map((clinic, idx) => {
            const isPrimary = idx === 0;
            return (
              <div 
                key={clinic.id} 
                className="p-5 rounded-[1.5rem] bg-white border border-line shadow-card hover:border-teal-300 transition-all space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-[1rem] bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-base font-display font-bold text-ink">
                          {clinic.clinicName}
                        </h2>
                        {isPrimary && (
                          <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-[0.625rem] font-bold">
                            Primary
                          </span>
                        )}
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[0.625rem] font-bold font-mono",
                          clinic.isActive !== false ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500"
                        )}>
                          {clinic.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 flex items-start gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span>{clinic.address}, {clinic.city}, {clinic.state}</span>
                      </p>

                      {clinic.phone && (
                        <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1 font-mono">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{clinic.phone}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <button 
                    onClick={() => handleOpenEdit(clinic)}
                    className="p-2 text-slate-400 hover:text-ink hover:bg-slate-100 rounded-[0.75rem] transition-colors cursor-pointer"
                    title="Edit clinic"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Bottom Tags / Kiosk Indicators (Reference Image 2 Screen 1) */}
                <div className="pt-3 border-t border-line/70 flex items-center justify-between flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 text-slate-600 font-medium">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>4 Doctors</span>
                    </span>

                    <span className="inline-flex items-center gap-1.5 text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200 text-[0.6875rem] font-semibold">
                      <Monitor className="w-3 h-3" />
                      <span>Reception Kiosk</span>
                    </span>
                  </div>

                  <a 
                    href={`/kiosk/${clinic.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1"
                  >
                    <span>Open Kiosk</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add / Edit Clinic Modal (Reference Image 2 Screen 2) ──────── */}
      {showModal && (
        <div className="fixed inset-0 bg-navy-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[1.75rem] max-w-lg w-full border border-line shadow-2xl overflow-hidden my-6">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-line flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="font-display font-bold text-base text-ink">
                  {editingClinic ? 'Edit Clinic' : 'Add Clinic'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter clinic details and configure settings.
                </p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-ink hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              
              {/* Clinic Name */}
              <div className="space-y-1.5">
                <label className="font-bold text-ink uppercase tracking-wider font-mono text-[0.625rem]">
                  Clinic Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Remedi Clinic"
                  value={formData.clinicName}
                  onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-[0.875rem] border border-line bg-white text-xs text-ink focus:border-teal-500 focus:outline-none shadow-2xs"
                />
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <label className="font-bold text-ink uppercase tracking-wider font-mono text-[0.625rem]">
                  Address *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Beside Vijaya Diagnostics, Gayathri Estates"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-[0.875rem] border border-line bg-white text-xs text-ink focus:border-teal-500 focus:outline-none shadow-2xs"
                />
              </div>

              {/* City & State */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-ink uppercase tracking-wider font-mono text-[0.625rem]">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-[0.875rem] border border-line bg-white text-xs text-ink focus:border-teal-500 focus:outline-none shadow-2xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-ink uppercase tracking-wider font-mono text-[0.625rem]">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-[0.875rem] border border-line bg-white text-xs text-ink focus:border-teal-500 focus:outline-none shadow-2xs"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <label className="font-bold text-ink uppercase tracking-wider font-mono text-[0.625rem]">
                  Phone Number *
                </label>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-2.5 rounded-[0.875rem] bg-slate-100 border border-line text-xs font-mono font-bold text-slate-700 flex items-center gap-1">
                    🇮🇳 +91
                  </span>
                  <input
                    type="tel"
                    required
                    placeholder="9440984397"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="flex-1 px-3.5 py-2.5 rounded-[0.875rem] border border-line bg-white text-xs text-ink font-mono focus:border-teal-500 focus:outline-none shadow-2xs"
                  />
                </div>
              </div>

              {/* Clinic Type Pills (Reference Image 2 Screen 2) */}
              <div className="space-y-1.5 pt-1">
                <label className="font-bold text-ink uppercase tracking-wider font-mono text-[0.625rem]">
                  Clinic Type
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {CLINIC_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, clinicType: type })}
                      className={cn(
                        "py-2 rounded-[0.75rem] text-xs font-bold transition-all border text-center cursor-pointer",
                        formData.clinicType === type
                          ? "bg-teal-700 text-white border-teal-700 shadow-2xs"
                          : "bg-white text-slate-600 border-line hover:bg-slate-50"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Map Location */}
              <div className="space-y-1.5 pt-1">
                <label className="font-bold text-ink uppercase tracking-wider font-mono text-[0.625rem]">
                  Map Location
                </label>
                <div className="flex items-center justify-between p-3 rounded-[0.875rem] bg-slate-50 border border-line">
                  <div className="flex items-center gap-2 truncate">
                    <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
                    <span className="text-xs text-slate-700 truncate">
                      {formData.mapLocation || 'Gayathri Estates, Kurnool, Andhra Pradesh'}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-teal-700 cursor-pointer">Change</span>
                </div>
              </div>

              {/* Reception Kiosk Toggle (Reference Image 2 Screen 2) */}
              <div className="flex items-center justify-between p-4 rounded-[1.25rem] bg-slate-50 border border-line pt-2">
                <div>
                  <p className="font-bold text-ink text-xs">Reception Kiosk</p>
                  <p className="text-[0.6875rem] text-slate-500 mt-0.5">
                    Enable reception desk kiosk for this location.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, kioskEnabled: !formData.kioskEnabled })}
                  className={cn(
                    "w-12 h-6 rounded-full transition-colors relative cursor-pointer",
                    formData.kioskEnabled ? "bg-teal-600" : "bg-slate-300"
                  )}
                >
                  <span className={cn(
                    "w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform shadow-xs",
                    formData.kioskEnabled ? "translate-x-6.5" : "translate-x-0.5"
                  )} />
                </button>
              </div>

              {/* Save Button */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3.5 rounded-[1.125rem] bg-navy-900 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs hover:bg-navy-800 transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4 text-teal-400" />
                  <span>{saving ? 'Saving...' : 'Save Clinic'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
