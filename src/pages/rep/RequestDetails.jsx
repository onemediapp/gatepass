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
import { generateCompanyKey } from '../../lib/companyKey';
import ReasonChip, { VISIT_REASONS } from '../../components/ui/ReasonChip';
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
  Tag,
  Users
} from 'lucide-react';
import EdgeCard from '../../components/ui/EdgeCard';
import ToggleSwitch from '../../components/ui/ToggleSwitch';
import MonoTag from '../../components/ui/MonoTag';
import LiveDot from '../../components/ui/LiveDot';
import Perforation from '../../components/ui/Perforation';
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

  // Addendum v2.1 states
  const rescheduleOf = navState.rescheduleOf || queryParams.get('rescheduleOf') || '';
  const [visitReason, setVisitReason] = useState('new_product');
  const [hasAccompaniment, setHasAccompaniment] = useState(false);
  const [accompaniedName, setAccompaniedName] = useState('');
  const [accompaniedDesignation, setAccompaniedDesignation] = useState('Area Manager');

  const [duplicateError, setDuplicateError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(!doctor || !selectedDate || !slotStart);

  const MESSAGE_STARTERS = {
    new_product: [
      'Sharing clinical trial data & monographs for...',
      'Introducing our new line of...',
      'Key efficacy & safety indicators for newly launched...'
    ],
    scientific_update: [
      'Recent international guidelines update on...',
      'Head-to-head comparative analysis regarding...',
      'New real-world evidence data on...'
    ],
    samples: [
      'Providing physician starter samples and leave-behinds for...',
      'Restocking clinic trial samples for...',
      'Demonstrating patient administration device for...'
    ],
    follow_up: [
      `Following up on patient feedback from our earlier visit on...`,
      'Checking clinical response with the regimen started on...',
      'Providing the monograph papers requested on...'
    ],
    scheme: [
      'Sharing hospital/pharmacy institutional pricing schemes for...',
      'Updated distributor availability & patient support program for...',
      'New volume discount structure for...'
    ],
    doctor_requested: [
      'Bringing the clinical references you requested during our last meeting...',
      'Following up as requested on your clinic schedule...',
      'Providing prescribing information requested by your clinic...'
    ],
    other: [
      'Brief consultation regarding...',
      'Requesting a short discussion on...',
      'Sharing therapeutic updates regarding...'
    ]
  };

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
    if (doctor?.comms?.requireReason !== false && !visitReason) {
      setSubmitError('Please select a reason for this visit.');
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

      const companyKey = await generateCompanyKey(repSnapshot.company);
      const accompaniedBy = hasAccompaniment && accompaniedName.trim()
        ? { name: accompaniedName.trim(), designation: (accompaniedDesignation || 'Area Manager').trim() }
        : null;

      const newAppointmentId = await submitAppointmentWithLink({
        doctorId: doctor.uid,
        clinicId: clinic?.id || '',
        repId: user.uid,
        repSnapshot,
        doctorSnapshot,
        productFocus: productFocus.trim(),
        therapeuticCategory: category.trim(),
        visitReason,
        accompaniedBy,
        companyKey,
        rescheduleOf,
        samplesFlag,
        message: message.trim().slice(0, 300),
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
    <div className="min-h-screen bg-cream-50 font-sans selection:bg-amber-100 selection:text-sand-600 pb-36">
      
      {/* ── Top Header ──────────────────────────────────────────────── */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-line/70 px-4 py-3 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(`/dr/${cleanSlug}/slots`)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[0.75rem] bg-cream-100/70 hover:bg-cream-200/70 text-ink transition-all active:scale-95 text-xs font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Change Slot</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-[0.6875rem] font-mono text-ink-mute uppercase tracking-wider hidden sm:inline">
              Step 2 of 2
            </span>
            <MonoTag variant="navy">Detailing Brief</MonoTag>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">

        {/* ── Slot Summary Boarding Pass Stub ─────────────────────────── */}
        <div className="bg-white rounded-[1.25rem] border border-line shadow-card overflow-hidden transition-all">
          <div className="h-1.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600" />
          
          <div className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-[0.875rem] bg-navy-900 text-amber-400 font-display font-bold text-base flex items-center justify-center flex-shrink-0 shadow-sm">
                  {doctor.name.replace('Dr. ', '').charAt(0)}
                </div>
                <div>
                  <span className="font-mono text-[0.625rem] uppercase tracking-wider text-sand-600 font-semibold block">
                    Consultation Detailing
                  </span>
                  <h2 className="font-display font-bold text-base sm:text-lg text-ink leading-tight">
                    {doctorDisplayName}
                  </h2>
                  <p className="text-xs text-teal-700 font-medium mt-0.5">
                    {doctor.specialty} {clinic && `· ${clinic.clinicName}`}
                  </p>
                </div>
              </div>

              <button
                onClick={() => navigate(`/dr/${cleanSlug}/slots`)}
                className="px-2.5 py-1 rounded-[0.5rem] bg-cream-100 hover:bg-cream-200 text-ink text-xs font-mono font-semibold transition-colors active:scale-95"
              >
                Edit
              </button>
            </div>
          </div>

          <Perforation />

          <div className="p-4 sm:p-5 bg-cream-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 font-mono text-ink">
              <Calendar className="w-4 h-4 text-amber-500" />
              <span className="font-semibold">
                {formatDateIST(selectedDate, 'EEEE, dd MMM yyyy')}
              </span>
            </div>
            
            <div className="inline-flex items-center gap-2 font-mono text-teal-800 font-bold bg-teal-50 px-3 py-1.5 rounded-[0.625rem] border border-teal-600/20 w-fit">
              <LiveDot color="teal" size="sm" />
              <Clock className="w-3.5 h-3.5 text-teal-600" />
              <span>{formatConciseRange(slotStart, slotEnd)}</span>
            </div>
          </div>
        </div>

        {/* ── Notice Context Chip (if responding to notice) ──────────── */}
        {notice && (
          <div className="p-3.5 bg-teal-50/90 border border-teal-600/30 text-teal-800 rounded-[1rem] text-xs font-medium flex items-center gap-2.5 shadow-2xs">
            <Tag className="w-4 h-4 text-teal-600 flex-shrink-0" />
            <span>
              Responding to Clinic Notice: <strong className="font-semibold text-teal-900">"{notice.title}"</strong>
            </span>
          </div>
        )}

        {/* ── Duplicate Error Banner ─────────────────────────────────── */}
        {duplicateError && (
          <div className="p-4 bg-coral-50 border border-coral-500/30 text-coral-800 rounded-[1rem] text-xs font-semibold flex items-start gap-2.5 shadow-2xs">
            <AlertCircle className="w-4 h-4 text-coral-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span>{duplicateError}</span>
              <p className="text-[0.6875rem] font-normal text-coral-700">
                To prevent reception queues, reps may only hold one active request per doctor per day.
              </p>
            </div>
          </div>
        )}

        {/* ── Read-Only Rep Profile Summary ───────────────────────────── */}
        <section className="space-y-2">
          <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-ink-mute font-semibold px-1">
            Your Representative Credential
          </span>

          <EdgeCard edge="navy" className="p-4 sm:p-5 bg-white space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-[0.875rem] bg-navy-100 text-navy-900 flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-2xs">
                <User className="w-5 h-5 text-navy-800" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-display font-bold text-sm text-ink truncate">
                    {userData?.name || user?.displayName}
                  </h4>
                  <MonoTag variant="neutral">{rep?.designation || 'MR'}</MonoTag>
                </div>
                <p className="text-xs text-ink-soft font-medium mt-0.5">
                  {rep?.companyName || 'Pharmaceutical Company'} {rep?.division && `(${rep.division} Div.)`}
                </p>
                <div className="text-[0.6875rem] text-ink-mute font-mono mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
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
            
            {/* 1. Reason Chips (Required unless disabled by doctor) */}
            <div className="space-y-2">
              <label className="font-mono text-[0.6875rem] uppercase tracking-wider text-ink-mute font-semibold block">
                Reason for Visit {doctor?.comms?.requireReason !== false && <span className="text-coral-600">*</span>}
              </label>
              <div className="flex flex-wrap gap-2">
                {VISIT_REASONS.map((r) => (
                  <ReasonChip
                    key={r.id}
                    reason={r}
                    selected={visitReason === r.id}
                    onClick={() => setVisitReason(r.id)}
                  />
                ))}
              </div>
            </div>

            {/* 2. Product Focus (Required, <=300 chars) */}
            <div className="space-y-1.5 pt-2 border-t border-line/70">
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
                className="w-full bg-cream-50/70 border border-line rounded-[1rem] px-4 py-3 text-xs sm:text-sm font-medium text-ink outline-none focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 transition-all resize-none placeholder:text-ink-mute"
              />
              <p className="text-[0.6875rem] text-ink-mute">
                Be specific. Clear product indications help the doctor approve quickly.
              </p>
            </div>

            {/* 3. Therapeutic Category (Pre-filled) */}
            <div className="space-y-1.5">
              <label className="font-mono text-[0.6875rem] uppercase tracking-wider text-ink-mute font-semibold">
                Therapeutic Segment
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Cardiology, Diabetology, Anti-infectives"
                className="w-full bg-cream-50/70 border border-line rounded-[1rem] px-4 py-3 text-xs sm:text-sm font-medium text-ink outline-none focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 transition-all placeholder:text-ink-mute"
              />
            </div>

            {/* 4. Accompanied By Toggle (+1 Field Colleague/Manager) */}
            <div className="pt-2 border-t border-line/70 space-y-3">
              <ToggleSwitch
                label="Accompanied by Manager / Field Colleague"
                description="Pharma visits joined by an Area Manager or Regional Manager (+1 person, counts as 1 visit)"
                checked={hasAccompaniment}
                onChange={setHasAccompaniment}
              />

              {hasAccompaniment && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-cream-50/80 rounded-[1rem] border border-line animate-in fade-in">
                  <div>
                    <label className="text-[0.625rem] font-mono uppercase tracking-wider text-ink-mute block mb-1">
                      Manager Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Priya Sharma"
                      value={accompaniedName}
                      onChange={(e) => setAccompaniedName(e.target.value)}
                      className="w-full bg-white border border-line rounded-[0.75rem] px-3.5 py-2 text-xs font-medium text-ink outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-100 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[0.625rem] font-mono uppercase tracking-wider text-ink-mute block mb-1">
                      Designation
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Area Manager"
                      value={accompaniedDesignation}
                      onChange={(e) => setAccompaniedDesignation(e.target.value)}
                      className="w-full bg-white border border-line rounded-[0.75rem] px-3.5 py-2 text-xs font-medium text-ink outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-100 transition-all"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 5. Samples Flag Toggle */}
            <div className="pt-2 border-t border-line/70">
              <ToggleSwitch
                label="Drug Samples / Visual Aids Available"
                description="Check if you will be providing physician samples or leave-behinds during the visit"
                checked={samplesFlag}
                onChange={setSamplesFlag}
              />
            </div>

            {/* 6. Message to Doctor (≤300 chars, with tap-to-fill starters) */}
            {doctor?.comms?.allowVisitMessage !== false && (
              <div className="space-y-2 pt-2 border-t border-line/70">
                <div className="flex items-center justify-between">
                  <label className="font-mono text-[0.6875rem] uppercase tracking-wider text-ink-mute font-semibold">
                    Message to Dr. {doctor.name} <span className="text-ink-mute/70 font-normal">(Optional)</span>
                  </label>
                  <span className={cn(
                    "font-mono text-[0.625rem]",
                    message.length > 270 ? "text-coral-600 font-bold" : "text-ink-mute"
                  )}>
                    {message.length}/300
                  </span>
                </div>
                <textarea
                  maxLength={300}
                  rows={2}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Short note regarding clinical topic or specific queries..."
                  className="w-full bg-cream-50/70 border border-line rounded-[1rem] px-4 py-3 text-xs sm:text-sm font-medium text-ink outline-none focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 transition-all resize-none placeholder:text-ink-mute"
                />

                {/* Tap-to-fill Starters */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[0.625rem] font-mono uppercase text-ink-mute block">Tap to fill starter:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(MESSAGE_STARTERS[visitReason] || MESSAGE_STARTERS.other).map((starter, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setMessage(starter)}
                        className="text-[0.6875rem] bg-white hover:bg-teal-50 hover:border-teal-300 hover:text-teal-900 text-ink-soft px-3 py-1 rounded-full border border-line text-left transition-all active:scale-95 shadow-2xs font-medium"
                      >
                        "{starter.slice(0, 36)}..."
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </EdgeCard>

          {submitError && (
            <div className="p-3.5 bg-coral-50 border border-coral-500/30 text-coral-800 rounded-[1rem] text-xs font-semibold flex items-center gap-2 shadow-2xs">
              <AlertCircle className="w-4 h-4 text-coral-600 flex-shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* ── Sticky Bottom Submit Dock & Privacy Notice ───────────── */}
          <div className="fixed bottom-0 left-0 right-0 bg-white/92 backdrop-blur-xl border-t border-line/70 p-3.5 sm:p-4 z-40 shadow-[0_-8px_32px_rgba(11,22,44,0.08)]">
            <div className="max-w-2xl mx-auto flex flex-col gap-2">
              
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 hidden sm:block">
                  <div className="flex items-center gap-1.5 font-mono text-[0.625rem] uppercase tracking-wider text-teal-700 font-semibold">
                    <LiveDot color="teal" size="sm" />
                    <span>Selected Window</span>
                  </div>
                  <span className="text-xs font-mono font-semibold text-ink truncate block mt-0.5">
                    {selectedDate} · {formatConciseRange(slotStart, slotEnd)}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || Boolean(duplicateError) || !productFocus.trim()}
                  className="w-full sm:w-auto sm:min-w-[280px] py-3.5 px-6 bg-navy-900 hover:bg-navy-800 text-white rounded-[1rem] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-navy-950/20 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>Sending Request...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-amber-400" />
                      <span>Send Request to Dr. {doctor.name}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Security & Reassurance Line */}
              <p className="text-[0.6875rem] text-center text-ink-mute flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600 inline" />
                <span>Dr. {doctor.name} will receive your credentialed profile and detailing brief.</span>
              </p>

            </div>
          </div>

        </form>

      </div>

    </div>
  );
}
