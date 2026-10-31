/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { getRep, updateRep } from '../../lib/db/reps';
import { updateUser } from '../../lib/db/users';
import { logout } from '../../lib/firebase';
import { useAuth } from '../../lib/auth';
import { 
  Check, 
  LogOut, 
  Briefcase, 
  ShieldCheck, 
  Building2, 
  Sparkles, 
  Phone, 
  User, 
  Menu, 
  Pill, 
  Stethoscope,
  MapPin,
  Mail,
  Award,
  Bell,
  Settings,
  HelpCircle,
  Trash2,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import { ToggleSwitch } from '../../components/ui/ToggleSwitch';
import { PhoneInput } from '../../components/ui/PhoneInput';
import { RepBottomNav } from '../../components/layout/RepBottomNav';
import RepDrawerMenu from '../../components/layout/RepDrawerMenu';
import SpecialtySelector from '../../components/rep/SpecialtySelector';
import ProductListManager from '../../components/rep/ProductListManager';
import Skeleton from '../../components/ui/Skeleton';
import EdgeCard from '../../components/ui/EdgeCard';
import MonoTag from '../../components/ui/MonoTag';
import LiveDot from '../../components/ui/LiveDot';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

export default function RepProfile() {
  const navigate = useNavigate();
  const { user, userData, setUserData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [formData, setFormData] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Profile'); // 'Profile' | 'Settings' | 'Edit'

  // Settings toggles (Image 14 Screen 4)
  const [notifications, setNotifications] = useState({
    confirmations: true,
    reminders: true,
    notices: true,
    marketing: false
  });

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const data = await getRep(user.uid);
        const repName = userData?.name || user?.displayName || 'Ravi Sharma';
        const initialSpecialties = Array.isArray(data?.specialties) && data.specialties.length > 0
          ? data.specialties
          : ['General Medicine', 'Diabetology', 'Dermatology'];

        const initialProducts = Array.isArray(data?.products) && data.products.length > 0
          ? data.products
          : [
              { id: 'p1', name: 'Semaglutide 0.25mg', molecule: 'GLP-1 RA', dosageForm: 'Prefilled Pen' },
              { id: 'p2', name: 'Dapagliflozin 10mg', molecule: 'SGLT2 Inhibitor', dosageForm: 'Tablet' },
              { id: 'p3', name: 'Barrier Repair Gel', molecule: 'Ceramides + Hyaluronic', dosageForm: 'Gel' }
            ];

        setFormData({
          companyName: 'Sunrise Pharma',
          designation: 'Professional Medical Representative',
          employeeId: 'EMP001',
          division: 'Cardio-Diabetology',
          territory: 'Kurnool Region (KR-A)',
          state: 'Andhra Pradesh',
          badgeId: 'MR-88294',
          reliabilityScore: 94,
          completedVisits: 18,
          managerName: 'Suresh Verma (Area Manager)',
          email: user.email || 'ravi.sharma@sunrisepharma.com',
          mobile: userData?.mobile || '+91 94409 84397',
          ...data,
          name: repName,
          specialties: initialSpecialties,
          products: initialProducts
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user, userData]);

  const updateForm = (key, val) => {
    setFormData(p => ({ ...p, [key]: val }));
    setSavedSuccess(false);
  };

  const handleSave = async () => {
    if (!formData) return;
    setSaving(true);
    try {
      const { id, uid, mobile, ...repUpdates } = formData;
      await updateRep(user.uid, repUpdates);
      if (mobile && mobile !== userData?.mobile) {
        await updateUser(user.uid, { mobile });
        if (setUserData) setUserData(prev => ({ ...prev, mobile }));
      }
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
      setActiveTab('Profile');
    } catch (err) {
      console.error(err);
      alert('Failed to save profile changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !formData) {
    return (
      <div className="pb-28 max-w-2xl mx-auto p-4 sm:p-6 space-y-4 font-sans">
        <Skeleton className="w-48 h-8 rounded-[0.75rem]" />
        <Skeleton className="w-full h-48 rounded-[1.25rem]" />
        <Skeleton className="w-full h-64 rounded-[1.25rem]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 font-sans pb-28 selection:bg-amber-100 selection:text-sand-600">
      
      {/* ── Top Header ───────────────────────────────────────────── */}
      <header className="bg-white/95 backdrop-blur-xl border-b border-line px-4 sm:px-6 py-3.5 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => navigate('/rep/home')}
              className="p-2 rounded-[0.75rem] bg-cream-100 hover:bg-cream-200 text-ink transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-lg sm:text-xl font-display font-bold text-ink">
              Representative Profile
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab(activeTab === 'Settings' ? 'Profile' : 'Settings')}
              className={cn(
                "p-2 rounded-[0.75rem] border transition-all cursor-pointer",
                activeTab === 'Settings' ? "bg-navy-900 text-white border-navy-900" : "bg-white text-slate-600 border-line hover:bg-cream-100"
              )}
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Container ───────────────────────────────────────── */}
      <main className="max-w-2xl mx-auto p-4 sm:p-6 space-y-5">
        
        {/* Navigation Tabs (Profile / Settings / Edit) */}
        <div className="flex items-center bg-cream-100/80 p-1 rounded-[1rem] border border-line text-xs font-semibold">
          {['Profile', 'Settings', 'Edit Detailing Portfolio'].map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={cn(
                "flex-1 py-2 rounded-[0.75rem] text-center transition-all cursor-pointer",
                activeTab === t ? "bg-navy-900 text-white shadow-sm font-bold" : "text-slate-600 hover:text-ink"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* TAB 1: PROFILE VIEW (Image 9 Screen 2) */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'Profile' && (
          <div className="space-y-5">
            {/* Rep Identity Card */}
            <div className="p-5 sm:p-6 rounded-[1.5rem] bg-white border border-line shadow-2xs space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-[1.25rem] bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center font-display font-bold text-2xl shadow-md flex-shrink-0">
                  {formData.name.charAt(0)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg sm:text-xl font-display font-bold text-ink">
                      {formData.name}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[0.625rem] font-mono font-bold bg-teal-50 text-teal-700 border border-teal-200 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>{formData.badgeId}</span>
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-teal-800 mt-0.5">
                    {formData.companyName} · <span className="text-slate-500 font-mono">EMP: {formData.employeeId}</span>
                  </p>

                  <p className="text-xs text-ink-soft mt-0.5">
                    Division: {formData.division}
                  </p>
                </div>
              </div>

              {/* Territory & Manager */}
              <div className="p-3.5 rounded-[1rem] bg-cream-50/70 border border-line/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <MapPin className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <span><strong>Territory:</strong> {formData.territory}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Building2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <span><strong>Manager:</strong> {formData.managerName}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Phone className="w-4 h-4 text-teal-600 flex-shrink-0" />
                  <span>{formData.mobile}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Mail className="w-4 h-4 text-purple-500 flex-shrink-0" />
                  <span className="truncate">{formData.email}</span>
                </div>
              </div>
            </div>

            {/* Performance Metrics Strip */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-4 rounded-[1.25rem] bg-white border border-line shadow-2xs space-y-1">
                <span className="text-xl sm:text-2xl font-display font-bold text-emerald-600 block">
                  {formData.completedVisits}
                </span>
                <span className="text-[0.6875rem] font-bold text-slate-500 uppercase tracking-wider block">
                  Completed Visits
                </span>
              </div>

              <div className="p-4 rounded-[1.25rem] bg-white border border-line shadow-2xs space-y-1">
                <span className="text-xl sm:text-2xl font-display font-bold text-purple-600 block">
                  {formData.reliabilityScore}%
                </span>
                <span className="text-[0.6875rem] font-bold text-slate-500 uppercase tracking-wider block">
                  Reliability Score
                </span>
              </div>

              <div className="p-4 rounded-[1.25rem] bg-white border border-line shadow-2xs space-y-1">
                <span className="text-xl sm:text-2xl font-display font-bold text-teal-600 block">
                  0
                </span>
                <span className="text-[0.6875rem] font-bold text-slate-500 uppercase tracking-wider block">
                  No Shows
                </span>
              </div>
            </div>

            {/* Active Detailing Portfolio Preview */}
            <div className="p-5 rounded-[1.25rem] bg-white border border-line shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-sm text-ink">
                  Promotional Molecules & Key Brands
                </h3>
                <button
                  onClick={() => setActiveTab('Edit Detailing Portfolio')}
                  className="text-xs font-bold text-navy-900 hover:underline"
                >
                  Edit Brands
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {formData.products.map(p => (
                  <span
                    key={p.id}
                    className="px-3 py-1.5 rounded-[0.75rem] bg-cream-50 border border-line text-xs font-semibold text-ink flex items-center gap-1.5"
                  >
                    <Pill className="w-3.5 h-3.5 text-teal-600" />
                    <span>{p.name} ({p.molecule})</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* TAB 2: SETTINGS (Image 14 Screen 4) */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'Settings' && (
          <div className="space-y-5">
            {/* Notification Preferences */}
            <section className="space-y-2">
              <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-slate-500 font-bold pl-1">
                Notifications
              </span>
              <div className="bg-white rounded-[1.25rem] border border-line p-5 divide-y divide-line shadow-2xs space-y-4">
                <div className="pt-0">
                  <ToggleSwitch
                    label="Appointment Confirmations"
                    description="Receive instant alerts when doctor approves your booking request."
                    checked={notifications.confirmations}
                    onChange={(v) => setNotifications(n => ({ ...n, confirmations: v }))}
                  />
                </div>
                <div className="pt-4">
                  <ToggleSwitch
                    label="Reminders"
                    description="Get push and WhatsApp reminders 1 hour prior to confirmed slot."
                    checked={notifications.reminders}
                    onChange={(v) => setNotifications(n => ({ ...n, reminders: v }))}
                  />
                </div>
                <div className="pt-4">
                  <ToggleSwitch
                    label="Clinic Notices"
                    description="Receive broadcasts when doctor updates hours or announces closures."
                    checked={notifications.notices}
                    onChange={(v) => setNotifications(n => ({ ...n, notices: v }))}
                  />
                </div>
                <div className="pt-4">
                  <ToggleSwitch
                    label="Marketing Updates"
                    description="Receive pharma product launches and GatePass feature updates."
                    checked={notifications.marketing}
                    onChange={(v) => setNotifications(n => ({ ...n, marketing: v }))}
                  />
                </div>
              </div>
            </section>

            {/* App Preferences */}
            <section className="space-y-2">
              <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-slate-500 font-bold pl-1">
                App Preferences
              </span>
              <div className="bg-white rounded-[1.25rem] border border-line p-4 divide-y divide-line shadow-2xs space-y-3">
                <div className="flex items-center justify-between text-xs pt-0">
                  <span className="font-semibold text-slate-700">Language</span>
                  <span className="font-mono font-bold text-ink">English</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-3">
                  <span className="font-semibold text-slate-700">Theme</span>
                  <span className="font-mono font-bold text-ink">System Default</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-3">
                  <span className="font-semibold text-slate-700">Clear Offline Cache</span>
                  <button
                    onClick={() => alert('Offline cache cleared.')}
                    className="px-3 py-1 bg-cream-100 hover:bg-cream-200 text-slate-700 rounded-[0.5rem] font-bold"
                  >
                    Clear Data
                  </button>
                </div>
              </div>
            </section>

            {/* Sign Out */}
            <button
              onClick={() => logout()}
              className="w-full py-3.5 px-4 rounded-[1rem] bg-rose-50 border border-rose-200 text-rose-600 font-bold text-xs flex items-center justify-center gap-2 hover:bg-rose-100 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out of Gatepass</span>
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* TAB 3: EDIT DETAILING PORTFOLIO */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'Edit Detailing Portfolio' && (
          <div className="space-y-5">
            <div className="p-5 rounded-[1.25rem] bg-white border border-line shadow-2xs space-y-4">
              <h3 className="font-display font-bold text-sm text-ink">
                Therapeutic Specialties & Key Products
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Mobile Contact *</label>
                  <PhoneInput
                    value={formData.mobile}
                    onChange={(v) => updateForm('mobile', v)}
                    placeholder="94409 84397"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Company Name</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => updateForm('companyName', e.target.value)}
                    className="w-full px-3 py-2 bg-cream-50 border border-line rounded-[0.75rem] text-xs font-medium text-ink outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Therapeutic Category</label>
                  <input
                    type="text"
                    value={formData.therapeuticCategory || 'Cardio-Diabetology'}
                    onChange={(e) => updateForm('therapeuticCategory', e.target.value)}
                    className="w-full px-3 py-2 bg-cream-50 border border-line rounded-[0.75rem] text-xs font-medium text-ink outline-none"
                  />
                </div>

                <div className="pt-2">
                  <ProductListManager
                    products={formData.products}
                    onChange={(prods) => updateForm('products', prods)}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-line">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full py-3.5 rounded-[1rem] bg-navy-900 hover:bg-navy-800 text-white font-display font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {saving ? (
                    <span>Saving Portfolio...</span>
                  ) : savedSuccess ? (
                    <><Check className="w-4 h-4 text-teal-300" /> Saved!</>
                  ) : (
                    <span>Save Detailing Portfolio</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Drawer menu */}
      <RepDrawerMenu
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        userData={user}
      />

      {/* Rep Bottom Navigation */}
      <RepBottomNav />
    </div>
  );
}
