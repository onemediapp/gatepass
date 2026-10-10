/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getDoctor } from '../../lib/db/doctors';
import { getDoctorUidBySlug } from '../../lib/db/doctorSlugs';
import { getClinic } from '../../lib/db/clinics';
import { getRep } from '../../lib/db/reps';
import { getNotice } from '../../lib/db/notices';
import { 
  checkExistingActiveRequest, 
  submitAppointmentWithLink 
} from '../../lib/db/appointments';
import { useAuth } from '../../lib/auth';
import { formatDateIST, formatTimeIST } from '../../lib/time';
import { formatConciseRange } from '../../lib/schedule';
import { 
  ArrowLeft, 
  Send, 
  Calendar, 
  Clock, 
  Building2, 
  User, 
  Briefcase, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  PackageCheck,
  ShieldCheck,
  Tag
} from 'lucide-react';
import EdgeCard from '../../components/ui/EdgeCard';
import ToggleSwitch from '../../components/ui/ToggleSwitch';
import MonoTag from '../../components/ui/MonoTag';
import Skeleton from '../../components/ui/Skeleton';
import { cn } from '../../lib/utils';

export default function RequestDetails() {
  const { slug, doctorId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userData } = useAuth();

  const identifier = slug || doctorId;

  // Passed state from SlotPicker (or query params fallback)
  const navState = location.state || {};
  const queryParams = new URLSearchParams(location.search);

  const selectedDate = navState.selectedDate || queryParams.get('date');
  const slotStart = navState.slotStart || queryParams.get('start');
  const slotEnd = navState.slotEnd || queryParams.get('end');
  const slotKey = navState.slotKey || (selectedDate && slotStart ? `${selectedDate}_${slotStart}` : '');
  const noticeId = navState.noticeId || queryParams.get('notice');

  const [doctor, setDoctor] = useState(navState.doctor || null);
  const [clinic, setClinic] = useState(navState.clinic || null);
  const [rep, setRep] = useState(null);
  const [notice, setNotice] = useState(null);

  const [productFocus, setProductFocus] = useState('');
  const [category, setCategory] = useState('');
  const [samplesFlag, setSamplesFlag] = useState(false);
  const [message, setMessage] = useState('');

  const [duplicateError, setDuplicateError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(!doctor || !selectedDate || !slotStart);

  useEffect(() => {
    async function loadInitialData() {
      if (!identifier || !selectedDate || !slotStart) {
        // Missing slot parameters, redirect back to slot picker
        navigate(`/dr/${identifier}/slots`, { replace: true });
        return;
      }

      try {
        // 1. Resolve Doctor if not already passed in state
        let currentDoc = doctor;
        if (!currentDoc) {
          let docUid = await getDoctorUidBySlug(identifier);
          if (!docUid) docUid = identifier;
          currentDoc = await getDoctor(docUid);
          setDoctor(currentDoc);
        }

        // 2. Load Clinic if needed
        if (!clinic && currentDoc?.clinicIds?.[0]) {
          const cData = await getClinic(currentDoc.clinicIds[0]);
          if (cData) setClinic(cData);
        }

        // 3. Load Rep Profile
        if (user) {
          const rData = await getRep(user.uid);
          if (rData) {
            setRep(rData);
            setCategory(rData.therapeuticCategory || '');
            if (rData.samplesAvailable) {
              setSamplesFlag(true);
            }
          }
        }

        // 4. Load Notice if responding to a notice
        if (noticeId) {
          const nData = await getNotice(noticeId);
          if (nData) setNotice(nData);
        }

        // 5. Duplicate Prevention Check
        if (user && currentDoc && selectedDate) {
          const existing = await checkExistingActiveRequest(user.uid, currentDoc.uid, selectedDate);
          if (existing) {
            setDuplicateError(`You already have an active Gatepass request (#${existing.id.slice(0, 6)}) with Dr. ${currentDoc.name} on ${selectedDate}.`);
          }
        }

      } catch (err) {
        console.error('Error loading request details:', err);
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, [identifier, user, selectedDate, slotStart]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 p-4 sm:p-6 max-w-2xl mx-auto space-y-4 font-sans">
        <Skeleton className="w-12 h-12 rounded-[0.75rem]" />
        <Skeleton className="w-full h-32 rounded-[1.25rem]" />
        <Skeleton className="w-full h-48 rounded-[1.25rem]" />
      </div>
    );
  }

  if (!doctor || !selectedDate || !slotStart) {
    return (
      <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center p-6 text-center font-sans">
        <AlertCircle className="w-12 h-12 text-coral-600 mb-3" />
        <h2 className="text-xl font-display font-bold text-ink">Invalid Request Parameters</h2>
        <p className="text-xs text-ink-soft mt-1">Please select an available consultation slot first.</p>
        <button
          onClick={() => navigate(`/dr/${identifier}/slots`)}
          className="mt-4 px-5 py-2.5 bg-navy-900 text-white rounded-[0.875rem] font-bold text-xs"
        >
          Select a Slot
        </button>
      </div>
    );
  }

  const cleanSlug = doctor.profileSlug || doctor.uid;
  const doctorDisplayName = doctor.name.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!productFocus.trim()) {
      setSubmitError('Please specify the primary products or drugs you will discuss.');
      return;
    }
    if (duplicateError) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const repSnapshot = {
        name: userData?.name || user?.displayName || 'Medical Representative',
        company: rep?.companyName || 'Pharma',
        designation: rep?.designation || 'MR',
        mobile: userData?.mobile || user?.phoneNumber || '',
        therapeuticCategory: category || rep?.therapeuticCategory || '',
      };

      const doctorSnapshot = {
        name: doctor.name,
        specialty: doctor.specialty || '',
        clinicName: clinic?.clinicName || '',
        city: doctor.city || clinic?.city || '',
      };

      const newAppointmentId = await submitAppointmentWithLink({
        doctorId: doctor.uid,
        clinicId: clinic?.id || '',
        repId: user.uid,
        repSnapshot,
        doctorSnapshot,
        productFocus: productFocus.trim(),
        therapeuticCategory: category.trim(),
        samplesFlag,
        message: message.trim(),
        noticeId: noticeId || '',
        slotDate: selectedDate,
        slotStart,
        slotEnd,
        slotKey,
      });

      // Navigate to status pass page
      navigate(`/status/${newAppointmentId}`, { replace: true });
    } catch (err) {
      console.error('Error submitting appointment:', err);
      setSubmitError(err.message || 'Failed to submit request. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 font-sans selection:bg-amber-100 selection:text-sand-600 pb-32">
      
      {/* ── Top Header ──────────────────────────────────────────────── */}
      <div className="bg-white/95 backdrop-blur-md border-b border-line px-4 py-3 sticky top-0 z-30 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(`/dr/${cleanSlug}/slots`)}
            className="inline-flex items-center gap-1.5 p-2 -ml-2 rounded-[0.75rem] hover:bg-cream-50 text-ink transition-colors active:scale-95 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Change Slot</span>
          </button>

          <div className="flex items-center gap-2">
            <MonoTag variant="navy">Step 2: Request</MonoTag>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">

        {/* ── Slot Summary Badge Card ─────────────────────────────────── */}
        <EdgeCard edge="amber" className="p-4 sm:p-5 bg-white space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="font-mono text-[0.625rem] uppercase tracking-wider text-sand-600 font-semibold block">
                Booking Appointment With
              </span>
              <h2 className="font-display font-bold text-base sm:text-lg text-ink leading-tight">
                {doctorDisplayName}
              </h2>
              <p className="text-xs text-teal-600 font-semibold mt-0.5">
                {doctor.specialty} {clinic && `· ${clinic.clinicName}`}
              </p>
            </div>

            <button
              onClick={() => navigate(`/dr/${cleanSlug}/slots`)}
              className="text-xs font-mono font-bold text-navy-900 hover:underline"
            >
              Edit
            </button>
          </div>

          {/* Slot Highlight */}
          <div className="p-3 bg-cream-50 rounded-[0.875rem] border border-line flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-mono text-ink">
              <Calendar className="w-4 h-4 text-ink-mute" />
              <span className="font-semibold">
                {formatDateIST(selectedDate, 'EEEE, dd MMM yyyy')}
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-teal-600 font-bold bg-teal-50 px-2.5 py-1 rounded-[0.5rem] border border-teal-600/20">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatConciseRange(slotStart, slotEnd)}</span>
            </div>
          </div>
        </EdgeCard>

        {/* ── Notice Context Chip (if responding to notice) ──────────── */}
        {notice && (
          <div className="p-3.5 bg-teal-50 border border-teal-600/30 text-teal-600 rounded-[1rem] text-xs font-medium flex items-center gap-2.5">
            <Tag className="w-4 h-4 flex-shrink-0" />
            <span>
              Responding to Clinic Notice: <strong className="font-semibold">"{notice.title}"</strong>
            </span>
          </div>
        )}

        {/* ── Duplicate Error Banner ─────────────────────────────────── */}
        {duplicateError && (
          <div className="p-4 bg-coral-50 border border-coral-600/30 text-coral-600 rounded-[1rem] text-xs font-semibold flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span>{duplicateError}</span>
              <p className="text-[0.6875rem] font-normal text-coral-600/90">
                To prevent reception queues, reps may only hold one active request per doctor per day.
              </p>
            </div>
          </div>
        )}

        {/* ── Read-Only Rep Profile Summary ───────────────────────────── */}
        <section className="space-y-2">
          <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-ink-mute font-semibold px-1">
            Your Representative Profile
          </span>

          <EdgeCard edge="navy" className="p-4 sm:p-5 bg-white space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-[0.75rem] bg-navy-100 text-navy-900 flex items-center justify-center font-bold text-sm flex-shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-display font-bold text-sm text-ink truncate">
                    {userData?.name || user?.displayName}
                  </h4>
                  <MonoTag variant="neutral">{rep?.designation || 'MR'}</MonoTag>
                </div>
                <p className="text-xs text-ink-soft font-medium mt-0.5">
                  {rep?.companyName || 'Pharmaceutical Company'} {rep?.division && `(${rep.division} Div.)`}
                </p>
                <div className="text-[0.6875rem] text-ink-mute font-mono mt-1 flex items-center gap-3">
                  <span>Tel: +91 {userData?.mobile || '9876543210'}</span>
                  <span>HQ: {userData?.city || 'Kurnool'}</span>
                </div>
              </div>
            </div>
          </EdgeCard>
        </section>

        {/* ── Request Details Form ────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          <EdgeCard edge="navy" className="p-5 sm:p-6 bg-white space-y-5">
            
            {/* Product Focus (Required, <=300 chars) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-mono text-[0.6875rem] uppercase tracking-wider text-ink-mute font-semibold">
                  Product / Molecule Focus <span className="text-coral-600">*</span>
                </label>
                <span className={cn(
                  "font-mono text-[0.625rem]",
                  productFocus.length > 280 ? "text-coral-600 font-bold" : "text-ink-mute"
                )}>
                  {productFocus.length}/300
                </span>
              </div>
              <textarea
                required
                maxLength={300}
                rows={3}
                value={productFocus}
                onChange={(e) => setProductFocus(e.target.value)}
                placeholder="e.g. Clinical data on Telmisartan 40mg + Chlorthalidone 12.5mg in uncontrolled stage 2 hypertension"
                className="w-full bg-cream-50 border border-line rounded-[0.875rem] px-4 py-3 text-xs sm:text-sm font-medium text-ink outline-none focus:border-navy-500 focus:bg-white transition-all resize-none placeholder:text-ink-mute"
              />
              <p className="text-[0.6875rem] text-ink-mute">
                Be specific. Clear product indications help the doctor approve quickly.
              </p>
            </div>

            {/* Therapeutic Category (Pre-filled) */}
            <div className="space-y-1.5">
              <label className="font-mono text-[0.6875rem] uppercase tracking-wider text-ink-mute font-semibold">
                Therapeutic Segment
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Cardiology, Diabetology, Anti-infectives"
                className="w-full bg-cream-50 border border-line rounded-[0.875rem] px-4 py-3 text-xs sm:text-sm font-medium text-ink outline-none focus:border-navy-500 transition-all placeholder:text-ink-mute"
              />
            </div>

            {/* Samples Flag Toggle */}
            <div className="pt-2 border-t border-line">
              <ToggleSwitch
                label="Drug Samples / Visual Aids Available"
                description="Check if you will be providing physician samples or leave-behinds during the visit"
                checked={samplesFlag}
                onChange={setSamplesFlag}
              />
            </div>

            {/* Optional Note to Doctor */}
            <div className="space-y-1.5 pt-2 border-t border-line">
              <label className="font-mono text-[0.6875rem] uppercase tracking-wider text-ink-mute font-semibold flex justify-between">
                <span>Personal Note to Dr. {doctor.name}</span>
                <span className="text-ink-mute/70">(Optional)</span>
              </label>
              <textarea
                maxLength={500}
                rows={2}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Brief clinical inquiry or special request"
                className="w-full bg-cream-50 border border-line rounded-[0.875rem] px-4 py-3 text-xs sm:text-sm font-medium text-ink outline-none focus:border-navy-500 focus:bg-white transition-all resize-none placeholder:text-ink-mute"
              />
            </div>

          </EdgeCard>

          {submitError && (
            <div className="p-3.5 bg-coral-50 border border-coral-600/30 text-coral-600 rounded-[1rem] text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* ── Sticky Bottom Submit Button ─────────────────────────── */}
          <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-line p-3 sm:p-4 z-40 shadow-[0_-4px_24px_rgba(11,23,48,0.08)]">
            <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
              
              <div className="min-w-0 hidden sm:block">
                <span className="font-mono text-[0.625rem] uppercase tracking-wider text-teal-600 font-semibold block">
                  Slot Confirmed
                </span>
                <span className="text-xs font-mono text-ink truncate block">
                  {selectedDate} · {formatConciseRange(slotStart, slotEnd)}
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || Boolean(duplicateError) || !productFocus.trim()}
                className="w-full sm:w-auto sm:min-w-[260px] py-3.5 px-6 bg-navy-900 hover:bg-navy-700 text-white rounded-[0.875rem] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span>Sending Request...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-amber-500" />
                    <span>Send Request to Dr. {doctor.name}</span>
                  </>
                )}
              </button>

            </div>
          </div>

        </form>

      </div>

    </div>
  );
}
