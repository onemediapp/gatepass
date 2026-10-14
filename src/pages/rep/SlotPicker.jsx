/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getDoctor } from '../../lib/db/doctors';
import { getDoctorUidBySlug } from '../../lib/db/doctorSlugs';
import { getClinic } from '../../lib/db/clinics';
import { getRep } from '../../lib/db/reps';
import { subscribeDoctorNotices } from '../../lib/db/notices';
import { subscribeSlotLedgersForDateRange } from '../../lib/db/slotLedger';
import { subscribeDayLedgersForDateRange } from '../../lib/db/dayLedger';
import { subscribeDoctorWeekLedgers } from '../../lib/db/weekLedger';
import { useAuth } from '../../lib/auth';
import { serverNow } from '../../lib/serverClock';
import { todayDateStr, formatDateIST } from '../../lib/time';
import { 
  generateDateStrip, 
  generateSlotsForDate, 
  getDateRangeForAdvanceDays 
} from '../../lib/slots';
import { hasConfiguredHours, formatConciseRange } from '../../lib/schedule';
import { generateCompanyKey } from '../../lib/companyKey';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Building2, 
  AlertCircle, 
  ChevronRight, 
  ShieldCheck, 
  Sparkles,
  Info,
  RefreshCw
} from 'lucide-react';
import EdgeCard from '../../components/ui/EdgeCard';
import SlotChip from '../../components/ui/SlotChip';
import MonoTag from '../../components/ui/MonoTag';
import Skeleton from '../../components/ui/Skeleton';
import { cn } from '../../lib/utils';

export default function SlotPicker() {
  const { slug, doctorId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const identifier = slug || doctorId;

  const [doctor, setDoctor] = useState(null);
  const [clinic, setClinic] = useState(null);
  const [rep, setRep] = useState(null);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Real-time Ledger States
  const [slotLedgers, setSlotLedgers] = useState({});
  const [dayLedgers, setDayLedgers] = useState({});
  const [weekLedgers, setWeekLedgers] = useState({});
  const [repCompanyKey, setRepCompanyKey] = useState('');

  // Selection states
  const [selectedDateStr, setSelectedDateStr] = useState(todayDateStr());
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Check query params for notice or reschedule
  const queryParams = new URLSearchParams(location.search);
  const queryNoticeId = queryParams.get('notice');
  const rescheduleOf = queryParams.get('rescheduleOf');

  useEffect(() => {
    let unsubSlotLedgers = () => {};
    let unsubDayLedgers = () => {};
    let unsubWeekLedgers = () => {};
    let unsubNotices = () => {};

    async function loadData() {
      if (!identifier) {
        setLoading(false);
        return;
      }

      try {
        // 1. Resolve Doctor UID
        let docUid = await getDoctorUidBySlug(identifier);
        if (!docUid) docUid = identifier;

        const dr = await getDoctor(docUid);
        if (!dr) {
          setDoctor(null);
          setLoading(false);
          return;
        }

        setDoctor(dr);

        // 2. Load Clinic
        if (dr.clinicIds && dr.clinicIds.length > 0) {
          try {
            const cData = await getClinic(dr.clinicIds[0]);
            if (cData) setClinic(cData);
          } catch (e) {}
        }

        // 3. Load Rep Profile (to match therapeutic category with notices and compute company key)
        if (user) {
          try {
            const rData = await getRep(user.uid);
            if (rData) {
              setRep(rData);
              if (rData.company) {
                generateCompanyKey(rData.company).then(setRepCompanyKey);
              }
            }
          } catch (e) {}
        }

        // 4. Compute 14-day date range and subscribe to real-time ledgers
        const today = todayDateStr();
        const advanceDays = dr.repSchedule?.advanceDays || 14;
        const { startDate, endDate } = getDateRangeForAdvanceDays(today, advanceDays);

        unsubSlotLedgers = subscribeSlotLedgersForDateRange(dr.uid, startDate, endDate, (data) => {
          setSlotLedgers(data);
        });

        unsubDayLedgers = subscribeDayLedgersForDateRange(dr.uid, startDate, endDate, (data) => {
          setDayLedgers(data);
        });

        unsubWeekLedgers = subscribeDoctorWeekLedgers(dr.uid, (wList) => {
          const map = {};
          wList.forEach(w => {
            const wKey = w.isoWeek || (w.id ? w.id.split('_')[1] : '');
            if (wKey) map[wKey] = w;
          });
          setWeekLedgers(map);
        });

        // 5. Subscribe to notices
        unsubNotices = subscribeDoctorNotices(dr.uid, (nList) => {
          setNotices(nList);
        });

      } catch (err) {
        console.error('Error initializing slot picker:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();

    return () => {
      unsubSlotLedgers();
      unsubDayLedgers();
      unsubWeekLedgers();
      unsubNotices();
    };
  }, [identifier, user]);

  const schedule = doctor?.repSchedule;
  const limits = doctor?.limits || {};
  const hasHours = hasConfiguredHours(schedule?.weekly);

  // Current server timestamp
  const nowMs = serverNow();

  // Generate 14-day strip with multi-ledger limits & company key
  const dateStrip = useMemo(() => {
    if (!schedule) return [];
    return generateDateStrip({
      schedule,
      limits,
      slotLedgers,
      dayLedgers,
      weekLedgers,
      repCompanyKey,
      repCategory: rep?.therapeuticCategory || '',
      currentServerMs: nowMs,
      startDateStr: todayDateStr(),
      advanceDays: schedule.advanceDays || 14,
    });
  }, [schedule, limits, slotLedgers, dayLedgers, weekLedgers, repCompanyKey, rep, nowMs]);

  // Set default selected date to first day with available slots or first day
  useEffect(() => {
    if (dateStrip.length > 0) {
      const isCurrentSelectedValid = dateStrip.some(d => d.dateStr === selectedDateStr);
      if (!isCurrentSelectedValid) {
        const firstAvailable = dateStrip.find(d => d.state === 'available') || dateStrip[0];
        setSelectedDateStr(firstAvailable.dateStr);
      }
    }
  }, [dateStrip, selectedDateStr]);

  // Active day's slots with multi-ledger limits & refusal reasons
  const selectedDayStrip = dateStrip.find(d => d.dateStr === selectedDateStr);
  const slotsForSelectedDay = useMemo(() => {
    if (!schedule || !selectedDateStr) return [];
    return generateSlotsForDate({
      dateStr: selectedDateStr,
      schedule,
      limits,
      slotLedgers,
      dayLedgers,
      weekLedgers,
      repCompanyKey,
      repCategory: rep?.therapeuticCategory || '',
      currentServerMs: nowMs,
    });
  }, [schedule, limits, selectedDateStr, slotLedgers, dayLedgers, weekLedgers, repCompanyKey, rep, nowMs]);

  // Soft warning notice matching
  const matchingNotAcceptingNotice = useMemo(() => {
    if (!notices.length || !rep?.therapeuticCategory) return null;
    const repCategory = rep.therapeuticCategory.toLowerCase().trim();
    return notices.find(n => {
      if (n.type !== 'not_accepting' && n.type !== 'closure') return false;
      if (!n.categories || n.categories.length === 0) return true;
      return n.categories.some(c => c.toLowerCase().trim() === repCategory || repCategory.includes(c.toLowerCase()));
    });
  }, [notices, rep]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 p-4 sm:p-6 max-w-2xl mx-auto space-y-4 font-sans">
        <Skeleton className="w-12 h-12 rounded-[0.75rem]" />
        <Skeleton className="w-full h-24 rounded-[1.25rem]" />
        <Skeleton className="w-full h-20 rounded-[1.25rem]" />
        <Skeleton className="w-full h-64 rounded-[1.25rem]" />
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
        <p className="text-ink-soft mt-1 text-xs sm:text-sm">
          Could not find doctor for slot booking.
        </p>
        <button
          onClick={() => navigate('/rep/search')}
          className="mt-6 font-bold text-xs text-white px-5 py-2.5 bg-navy-900 rounded-[0.875rem] shadow-sm hover:bg-navy-700 transition-all"
        >
          Return to Search
        </button>
      </div>
    );
  }

  const cleanSlug = doctor.profileSlug || doctor.uid;
  const doctorDisplayName = doctor.name.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`;

  const handleContinue = () => {
    if (!selectedSlot) return;
    navigate(`/dr/${cleanSlug}/request`, {
      state: {
        doctor,
        clinic,
        selectedDate: selectedDateStr,
        slotStart: selectedSlot.slotStart,
        slotEnd: selectedSlot.slotEnd,
        slotKey: selectedSlot.slotKey,
        noticeId: queryNoticeId || matchingNotAcceptingNotice?.id || '',
        rescheduleOf: rescheduleOf || '',
      },
    });
  };

  return (
    <div className="min-h-screen bg-cream-50 font-sans selection:bg-amber-100 selection:text-sand-600 pb-28">
      
      {/* ── Top Header Bar ───────────────────────────────────────────── */}
      <div className="bg-white/95 backdrop-blur-md border-b border-line px-4 py-3 sticky top-0 z-30 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(`/dr/${cleanSlug}`)}
            className="inline-flex items-center gap-1.5 p-2 -ml-2 rounded-[0.75rem] hover:bg-cream-50 text-ink transition-colors active:scale-95 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Profile</span>
          </button>

          <div className="flex items-center gap-2">
            <MonoTag variant="navy">Slot Picker</MonoTag>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-5">
        
        {/* ── Doctor Mini-Header Card ──────────────────────────────────── */}
        <EdgeCard edge="navy" className="p-4 sm:p-5 bg-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display font-bold text-base sm:text-lg text-ink leading-tight">
                {doctorDisplayName}
              </h2>
              <p className="text-xs text-teal-600 font-semibold mt-0.5">
                {doctor.specialty} {doctor.qualifications && `· ${doctor.qualifications}`}
              </p>
              {clinic && (
                <p className="text-xs text-ink-soft mt-1 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-ink-mute flex-shrink-0" />
                  <span>{clinic.clinicName}, {clinic.city}</span>
                </p>
              )}
            </div>

            <MonoTag variant="neutral">
              {schedule?.slotMinutes || 20}m Slots
            </MonoTag>
          </div>
        </EdgeCard>

        {/* ── Reschedule Notice Banner ── */}
        {rescheduleOf && (
          <div className="p-3.5 bg-amber-50 border border-amber-300 text-amber-900 rounded-[1rem] text-xs font-medium flex items-center gap-2.5 shadow-xs">
            <RefreshCw className="w-4 h-4 flex-shrink-0 text-amber-700" />
            <span>You are rescheduling your visit. Pick a new slot to submit your request.</span>
          </div>
        )}

        {/* ── Soft Warning Notice (if doctor not accepting rep's category) */}
        {matchingNotAcceptingNotice && (
          <div className="p-3.5 bg-sand-50 border border-sand-600/30 text-sand-600 rounded-[1rem] text-xs font-medium flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold block">
                {matchingNotAcceptingNotice.title}
              </span>
              <span className="text-ink-soft leading-relaxed block">
                Dr. {doctor.name} isn't taking {rep?.therapeuticCategory || 'new'} reps this period. You can still send a request.
              </span>
            </div>
          </div>
        )}

        {/* ── Date Strip (Horizontal Scroll, 14 Days) ──────────────────── */}
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-ink-mute font-semibold">
              Select Visit Date
            </span>
            <span className="text-[0.6875rem] font-mono text-ink-mute">
              14 Days Window
            </span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 pt-1 scroll-smooth no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            {dateStrip.map((day) => {
              const isSelected = day.dateStr === selectedDateStr;
              const isAvailable = day.state === 'available';

              return (
                <button
                  key={day.dateStr}
                  type="button"
                  onClick={() => {
                    setSelectedDateStr(day.dateStr);
                    setSelectedSlot(null);
                  }}
                  className={cn(
                    "flex-shrink-0 flex flex-col items-center justify-center min-w-[5.25rem] p-2.5 rounded-[1rem] border transition-all select-none text-center",
                    isSelected
                      ? "bg-navy-900 text-white border-navy-900 shadow-md ring-2 ring-amber-500/50"
                      : isAvailable
                      ? "bg-white text-ink border-line hover:border-navy-500 hover:shadow-sm"
                      : "bg-cream-50/70 text-ink-mute border-line/60 opacity-60"
                  )}
                >
                  <span className="font-mono text-[0.6875rem] uppercase font-semibold block">
                    {day.dayLabel}
                  </span>
                  <span className="font-display font-bold text-lg leading-tight my-0.5 block">
                    {day.dateNumber}
                  </span>
                  <span className={cn(
                    "text-[0.5625rem] font-medium px-1.5 py-0.5 rounded-[0.25rem] leading-none mt-1 block truncate max-w-full",
                    isSelected
                      ? "bg-white/20 text-white"
                      : isAvailable
                      ? "bg-teal-50 text-teal-600 font-semibold"
                      : "bg-cream-50 text-ink-mute"
                  )}>
                    {day.chipLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Slot Grid (Cinema-Seat Style for Selected Day) ──────────── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-ink-mute font-semibold">
              Available Consultation Slots
            </span>
            {selectedDayStrip && (
              <span className="text-xs text-ink-soft font-medium">
                {formatDateIST(selectedDateStr, 'EEEE, dd MMM yyyy')}
              </span>
            )}
          </div>

          {!hasHours ? (
            <EdgeCard edge="sand" className="p-8 bg-white text-center space-y-3">
              <Clock className="w-8 h-8 mx-auto text-sand-600 opacity-60" />
              <h3 className="font-display font-bold text-base text-ink">
                No Rep Hours Configured
              </h3>
              <p className="text-xs text-ink-soft max-w-xs mx-auto">
                Dr. {doctor.name} has not set up visiting hours yet. You can message them on WhatsApp if granted.
              </p>
            </EdgeCard>
          ) : selectedDayStrip?.state === 'closed' ? (
            <EdgeCard edge="coral" className="p-8 bg-white text-center space-y-2">
              <AlertCircle className="w-8 h-8 mx-auto text-coral-600 opacity-80" />
              <h3 className="font-display font-bold text-base text-ink">
                Doctor is Closed on This Date
              </h3>
              <p className="text-xs text-ink-soft">
                This date is marked as out of town or blocked by the doctor. Please select another date.
              </p>
            </EdgeCard>
          ) : selectedDayStrip?.state === 'no_hours' ? (
            <EdgeCard edge="navy" className="p-8 bg-white text-center space-y-2">
              <Calendar className="w-8 h-8 mx-auto text-ink-mute opacity-60" />
              <h3 className="font-display font-bold text-base text-ink">
                No MR Hours on {selectedDayStrip?.dayLabel}s
              </h3>
              <p className="text-xs text-ink-soft">
                Dr. {doctor.name} does not meet representatives on this day of the week.
              </p>
            </EdgeCard>
          ) : slotsForSelectedDay.length === 0 ? (
            <EdgeCard edge="navy" className="p-8 bg-white text-center space-y-2">
              <Clock className="w-8 h-8 mx-auto text-ink-mute opacity-60" />
              <h3 className="font-display font-bold text-base text-ink">
                No Available Slots
              </h3>
              <p className="text-xs text-ink-soft">
                All slots on this date have ended or reached full capacity.
              </p>
            </EdgeCard>
          ) : (
            <EdgeCard edge="amber" className="p-5 bg-white space-y-4">
              
              {/* Legend Strip */}
              <div className="flex items-center justify-end gap-3 text-[0.6875rem] text-ink-mute font-mono pb-2 border-b border-line">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-[0.25rem] border border-line bg-white inline-block" />
                  Available
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-[0.25rem] bg-navy-900 inline-block" />
                  Selected
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-[0.25rem] bg-cream-50 border border-line/60 inline-block" />
                  Full
                </span>
              </div>

              {/* Grid of Cinema-Seat Slot Chips */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                {slotsForSelectedDay.map((slot) => {
                  const isSelected = selectedSlot?.slotKey === slot.slotKey;
                  const chipState = isSelected ? 'selected' : slot.state;

                  return (
                    <SlotChip
                      key={slot.slotKey}
                      state={chipState}
                      time={slot.slotStart}
                      remaining={slot.state === 'available' ? (slot.maxCount - slot.approvedCount) : undefined}
                      refusalLabel={slot.refusalReason}
                      onClick={() => {
                        if (slot.state === 'available') {
                          setSelectedSlot(slot);
                        }
                      }}
                    />
                  );
                })}
              </div>

            </EdgeCard>
          )}

        </section>

      </div>

      {/* ── Sticky Bottom Footer: Selected Slot Summary + Continue ──── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-line p-3 sm:p-4 z-40 shadow-[0_-4px_24px_rgba(11,23,48,0.08)]">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          
          <div className="min-w-0">
            {selectedSlot ? (
              <div>
                <span className="font-mono text-[0.625rem] uppercase tracking-wider text-teal-600 font-semibold block">
                  Selected Time Slot
                </span>
                <div className="font-display font-bold text-xs sm:text-sm text-ink truncate flex items-center gap-1.5">
                  <span>{formatDateIST(selectedDateStr, 'EEE, dd MMM')}</span>
                  <span>·</span>
                  <span className="font-mono text-teal-600">
                    {formatConciseRange(selectedSlot.slotStart, selectedSlot.slotEnd)}
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <span className="font-mono text-[0.625rem] uppercase tracking-wider text-ink-mute font-semibold block">
                  Select a Slot
                </span>
                <span className="text-xs text-ink-soft">
                  Tap an available time chip above
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={!selectedSlot}
            onClick={handleContinue}
            className="py-3 px-6 bg-navy-900 hover:bg-navy-700 text-white rounded-[0.875rem] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            <span>Continue</span>
            <ChevronRight className="w-4 h-4 text-amber-500" />
          </button>

        </div>
      </div>

    </div>
  );
}
