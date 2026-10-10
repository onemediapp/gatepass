/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDoctor } from '../../lib/db/doctors';
import { getDoctorUidBySlug } from '../../lib/db/doctorSlugs';
import { getClinic } from '../../lib/db/clinics';
import { subscribeDoctorNotices } from '../../lib/db/notices';
import { hasContactGrant } from '../../lib/db/contactGrants';
import { getDoctorContact } from '../../lib/db/doctorContacts';
import { useAuth } from '../../lib/auth';
import { 
  DAYS_ORDER, 
  DAY_LABELS, 
  formatConciseRange, 
  hasConfiguredHours, 
  generatePlainLanguageSummary,
  isDoctorOpenNow,
  formatResponseTimeBucket
} from '../../lib/schedule';
import { 
  MapPin, 
  Clock, 
  MessageCircle, 
  Calendar, 
  ArrowLeft, 
  ShieldCheck, 
  Building2, 
  AlertCircle, 
  Info, 
  CheckCircle2, 
  Phone, 
  ExternalLink,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import EdgeCard from '../../components/ui/EdgeCard';
import Skeleton from '../../components/ui/Skeleton';
import LiveDot from '../../components/ui/LiveDot';
import MonoTag from '../../components/ui/MonoTag';
import { cn } from '../../lib/utils';

export default function DoctorProfile() {
  const { slug, doctorId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [doctor, setDoctor] = useState(null);
  const [clinics, setClinics] = useState([]);
  const [notices, setNotices] = useState([]);
  const [hasWhatsAppGrant, setHasWhatsAppGrant] = useState(false);
  const [contactInfo, setContactInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  const identifier = slug || doctorId;

  useEffect(() => {
    let unsubscribeNotices = () => {};

    async function loadDoctorData() {
      if (!identifier) {
        setLoading(false);
        return;
      }

      try {
        // Resolve doctor UID from slug or direct UID
        let docUid = await getDoctorUidBySlug(identifier);
        if (!docUid) docUid = identifier;

        const drDoc = await getDoctor(docUid);
        if (!drDoc) {
          setDoctor(null);
          setLoading(false);
          return;
        }

        setDoctor(drDoc);

        // Fetch associated clinics
        if (drDoc.clinicIds && drDoc.clinicIds.length > 0) {
          const loadedClinics = [];
          for (const cid of drDoc.clinicIds) {
            try {
              const cData = await getClinic(cid);
              if (cData) loadedClinics.push(cData);
            } catch (e) {}
          }
          setClinics(loadedClinics);
        }

        // Check WhatsApp contact access for authenticated rep
        if (user && drDoc.privacy?.allowWhatsAppRedirect !== false) {
          const granted = await hasContactGrant(drDoc.uid, user.uid);
          setHasWhatsAppGrant(granted);
          if (granted) {
            const cDetails = await getDoctorContact(drDoc.uid);
            setContactInfo(cDetails);
          }
        }

        // Subscribe to active notices from this doctor
        unsubscribeNotices = subscribeDoctorNotices(drDoc.uid, (list) => {
          setNotices(list);
        });

      } catch (err) {
        console.error('Error fetching doctor profile:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDoctorData();

    return () => {
      unsubscribeNotices();
    };
  }, [identifier, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 p-4 sm:p-6 max-w-2xl mx-auto space-y-4 font-sans">
        <Skeleton className="w-12 h-12 rounded-[0.75rem]" />
        <Skeleton className="w-full h-48 rounded-[1.25rem]" />
        <Skeleton className="w-full h-32 rounded-[1.25rem]" />
        <Skeleton className="w-full h-40 rounded-[1.25rem]" />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-16 h-16 bg-white shadow-sm border border-line rounded-[1.25rem] flex items-center justify-center mb-4 text-ink-mute">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-display font-bold text-ink">Doctor Not Found</h2>
        <p className="text-ink-soft mt-1 text-xs sm:text-sm max-w-sm">
          We could not find a doctor profile with the identifier "{identifier}".
        </p>
        <button
          onClick={() => navigate('/rep/search')}
          className="mt-6 font-bold text-xs text-white px-5 py-2.5 bg-navy-900 rounded-[0.875rem] shadow-sm hover:bg-navy-700 transition-all"
        >
          Browse All Doctors
        </button>
      </div>
    );
  }

  const p = doctor.privacy || {};
  const schedule = doctor.repSchedule || {};
  const isOpenNow = isDoctorOpenNow(schedule);
  const responseBucket = formatResponseTimeBucket(doctor.stats);
  const hasHours = hasConfiguredHours(schedule.weekly);
  const canRequestSlots = p.allowAppointmentRequest !== false && hasHours;

  const displayName = p.showFullName !== false
    ? (doctor.name.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`)
    : `Dr. (${p.showSpecialty !== false ? doctor.specialty : 'Specialist'})`;

  const getInitials = (name) => {
    if (!name) return 'DR';
    return name
      .replace(/^dr\.?\s+/i, '')
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const getNoticeEdge = (type) => {
    switch (type) {
      case 'closure': return 'coral';
      case 'not_accepting': return 'sand';
      case 'looking_for': return 'teal';
      default: return 'navy';
    }
  };

  const cleanSlug = doctor.profileSlug || doctor.uid;

  const handleOpenWhatsApp = () => {
    if (!contactInfo?.whatsappNumber) return;
    const cleanNumber = contactInfo.whatsappNumber.replace(/\D/g, '');
    const repName = user?.displayName || 'Medical Representative';
    const msg = encodeURIComponent(`Hello Dr. ${doctor.name}, I am ${repName} visiting regarding Gatepass.`);
    window.open(`https://wa.me/91${cleanNumber}?text=${msg}`, '_blank');
  };

  return (
    <div className="min-h-screen font-sans bg-cream-50 pb-28 selection:bg-amber-100 selection:text-sand-600">
      
      {/* Top Navigation Bar */}
      <div className="bg-white/95 backdrop-blur-md border-b border-line px-4 py-3 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 p-2 -ml-2 rounded-[0.75rem] hover:bg-cream-50 text-ink transition-colors active:scale-95 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2">
            {isOpenNow && <MonoTag variant="teal">Open Now</MonoTag>}
            <MonoTag variant="neutral">Verified Doctor</MonoTag>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">

        {/* ── Active Notices Section (At Top, colored by type) ──────── */}
        {notices.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-1.5 px-1">
              <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-ink-mute font-semibold">
                Clinic Notices ({notices.length})
              </span>
            </div>

            <div className="space-y-2.5">
              {notices.map((notice) => (
                <EdgeCard
                  key={notice.id}
                  edge={getNoticeEdge(notice.type)}
                  className="p-4 bg-white space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-display font-bold text-sm text-ink leading-tight">
                      {notice.title}
                    </h4>
                    <span className="font-mono text-[0.625rem] uppercase tracking-wider px-2 py-0.5 rounded-[0.375rem] bg-cream-50 border border-line text-ink-mute flex-shrink-0">
                      {notice.type.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-ink-soft leading-relaxed">
                    {notice.body}
                  </p>
                  {notice.categories && notice.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {notice.categories.map((cat, i) => (
                        <span key={i} className="text-[0.625rem] font-mono px-2 py-0.5 bg-cream-50 rounded-full text-ink-mute border border-line">
                          #{cat}
                        </span>
                      ))}
                    </div>
                  )}
                </EdgeCard>
              ))}
            </div>
          </section>
        )}

        {/* ── Header Card ───────────────────────────────────────────── */}
        <EdgeCard edge="navy" className="p-5 sm:p-6 bg-white space-y-5">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[1.25rem] bg-cream-50 border border-line flex items-center justify-center font-display font-bold text-ink text-xl sm:text-2xl overflow-hidden shadow-sm">
                {doctor.photoUrl && p.showFullName !== false ? (
                  <img src={doctor.photoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  getInitials(doctor.name)
                )}
              </div>
              {isOpenNow && (
                <div className="absolute -top-1 -right-1">
                  <LiveDot active={true} />
                </div>
              )}
            </div>

            {/* Profile Core Info */}
            <div className="flex-1 min-w-0">
              <h2 className="font-display font-bold text-lg sm:text-xl text-ink leading-tight truncate">
                {displayName}
              </h2>
              
              <p className="text-xs sm:text-sm text-teal-600 font-semibold mt-0.5">
                {p.showSpecialty !== false ? doctor.specialty : 'Medical Specialist'}
              </p>

              {doctor.qualifications && (
                <p className="text-xs text-ink-soft mt-0.5 font-medium">
                  {doctor.qualifications}
                </p>
              )}

              {/* City and Reg Number */}
              <div className="flex items-center gap-3 mt-2 flex-wrap text-xs text-ink-mute">
                {p.showCity !== false && doctor.city && (
                  <span className="flex items-center gap-1 font-medium">
                    <MapPin className="w-3.5 h-3.5" />
                    {doctor.city}, {doctor.state || 'India'}
                  </span>
                )}
                {doctor.regNumber && (
                  <span className="font-mono text-[0.6875rem]">
                    Reg: {doctor.regNumber}
                  </span>
                )}
                {doctor.yearsExperience > 0 && (
                  <span className="font-medium">
                    {doctor.yearsExperience} yrs exp
                  </span>
                )}
              </div>

              {/* Response Time Badge */}
              {responseBucket && (
                <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[0.5rem] bg-navy-100 text-ink text-xs font-medium">
                  <Clock className="w-3.5 h-3.5 text-ink-soft" />
                  <span>Usually replies within {responseBucket}</span>
                </div>
              )}
            </div>
          </div>

          {/* WhatsApp Direct Message Row (Conditioned on grant) */}
          {p.allowWhatsAppRedirect !== false && (
            <div className="pt-3 border-t border-line">
              {hasWhatsAppGrant && contactInfo?.whatsappNumber ? (
                <button
                  onClick={handleOpenWhatsApp}
                  className="w-full py-2.5 px-4 bg-teal-50 border border-teal-600/30 text-teal-600 hover:bg-teal-600 hover:text-white rounded-[0.875rem] font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.99]"
                >
                  <MessageCircle className="w-4 h-4" />
                  Message Dr. {doctor.name} on WhatsApp
                </button>
              ) : (
                <div className="p-3 bg-cream-50 rounded-[0.875rem] border border-line flex items-start gap-2.5 text-xs text-ink-mute">
                  <Info className="w-4 h-4 flex-shrink-0 text-ink-mute mt-0.5" />
                  <span>
                    Direct WhatsApp communication unlocks once Dr. {doctor.name} approves an appointment with you.
                  </span>
                </div>
              )}
            </div>
          )}
        </EdgeCard>

        {/* ── Weekly Rep-Hours Strip ─────────────────────────────────── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-ink-mute font-semibold">
              Weekly Medical Rep Visiting Hours
            </span>
            {schedule.slotMinutes && (
              <MonoTag variant="neutral">{schedule.slotMinutes}-min slots</MonoTag>
            )}
          </div>

          <EdgeCard edge="amber" className="p-5 bg-white space-y-4">
            {/* Plain language summary preview */}
            <div className="p-3 bg-amber-50/50 rounded-[0.875rem] border border-amber-500/20 text-xs font-semibold text-ink leading-relaxed">
              "{generatePlainLanguageSummary(schedule)}"
            </div>

            {/* Mon-Sun Day Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {DAYS_ORDER.map((dayKey) => {
                const ranges = schedule.weekly?.[dayKey] || [];
                const hasDayHours = ranges.length > 0;

                return (
                  <div
                    key={dayKey}
                    className={cn(
                      "flex items-center justify-between p-2.5 rounded-[0.75rem] border transition-colors",
                      hasDayHours
                        ? "bg-cream-50 border-line text-ink"
                        : "bg-transparent border-line/60 text-ink-mute/70"
                    )}
                  >
                    <span className="font-bold w-12 font-mono text-[0.75rem]">
                      {DAY_LABELS[dayKey]}
                    </span>
                    <span className="font-medium text-right truncate">
                      {hasDayHours ? (
                        ranges.map((r, i) => (
                          <span key={i} className="inline-block font-mono text-[0.6875rem]">
                            {formatConciseRange(r.start, r.end)}{i < ranges.length - 1 ? ', ' : ''}
                          </span>
                        ))
                      ) : (
                        <span className="text-ink-mute text-[0.6875rem]">No MR hours</span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Quota details & Blocked Dates */}
            <div className="pt-2 border-t border-line flex flex-wrap items-center justify-between gap-2 text-xs text-ink-mute">
              {schedule.maxRepsPerDay > 0 && (
                <span>Daily Quota: <strong className="text-ink font-semibold">{schedule.maxRepsPerDay} reps max</strong></span>
              )}
              {schedule.advanceDays > 0 && (
                <span>Booking window: <strong className="text-ink font-semibold">{schedule.advanceDays} days</strong> in advance</span>
              )}
            </div>

            {schedule.blockedDates && schedule.blockedDates.length > 0 && (
              <div className="p-2.5 bg-coral-50 rounded-[0.75rem] border border-coral-600/20 text-coral-600 text-[0.6875rem] font-medium flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>
                  Doctor is out of station on: {schedule.blockedDates.join(', ')}
                </span>
              </div>
            )}
          </EdgeCard>
        </section>

        {/* ── Clinics & Reception Section ────────────────────────────── */}
        {clinics.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-ink-mute font-semibold">
                Practice Clinics ({clinics.length})
              </span>
            </div>

            <div className="space-y-3">
              {clinics.map((clinic) => (
                <EdgeCard key={clinic.id} edge="teal" className="p-4 sm:p-5 bg-white space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-display font-bold text-sm sm:text-base text-ink">
                        {clinic.clinicName}
                      </h4>
                      <p className="text-xs text-ink-soft mt-0.5 flex items-start gap-1">
                        <MapPin className="w-3.5 h-3.5 mt-0.5 text-ink-mute flex-shrink-0" />
                        <span>{clinic.address}, {clinic.city}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(`/clinic/${clinic.slug}`)}
                      className="p-2 rounded-[0.75rem] bg-cream-50 hover:bg-navy-100 text-ink-soft transition-colors flex items-center gap-1 text-[0.6875rem] font-semibold flex-shrink-0"
                      title="View Clinic Page"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Clinic Info</span>
                    </button>
                  </div>
                  {clinic.phone && (
                    <div className="text-[0.6875rem] font-mono text-ink-mute pt-1 border-t border-line flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {clinic.phone}
                    </div>
                  )}
                </EdgeCard>
              ))}
            </div>
          </section>
        )}

      </div>

      {/* ── Sticky Bottom CTA ("Pick a slot") ────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-line p-3 sm:p-4 z-40 shadow-[0_-4px_24px_rgba(11,23,48,0.08)]">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="min-w-0 hidden sm:block">
            <span className="font-mono text-[0.625rem] uppercase tracking-wider text-ink-mute font-semibold block">
              Consultation Booking
            </span>
            <span className="font-bold text-xs text-ink truncate block">
              {displayName}
            </span>
          </div>

          <div className="flex-1 sm:flex-initial sm:min-w-[240px]">
            {canRequestSlots ? (
              <button
                onClick={() => navigate(`/dr/${cleanSlug}/slots`)}
                className="w-full py-3 px-6 bg-navy-900 hover:bg-navy-700 text-white rounded-[0.875rem] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99]"
              >
                <Calendar className="w-4 h-4 text-amber-500" />
                <span>Pick a Slot</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                disabled
                className="w-full py-3 px-4 bg-line text-ink-mute rounded-[0.875rem] font-bold text-xs flex items-center justify-center gap-2 cursor-not-allowed text-center"
              >
                {!hasHours ? 'No Visiting Slots Configured' : 'Not Taking Appointments'}
              </button>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
