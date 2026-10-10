import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { getDoctor, updateDoctor, DEFAULT_REP_SCHEDULE } from '../../lib/db/doctors';
import { hasConfiguredHours } from '../../lib/schedule';
import { ArrowLeft, Check, Save } from 'lucide-react';
import RepScheduleEditor from '../../components/doctor/RepScheduleEditor';
import Skeleton from '../../components/ui/Skeleton';
import EdgeCard from '../../components/ui/EdgeCard';

export default function DoctorScheduleSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [schedule, setSchedule] = useState(DEFAULT_REP_SCHEDULE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    async function fetchDoctorSchedule() {
      if (!user) return;
      try {
        const dr = await getDoctor(user.uid);
        if (dr?.repSchedule) {
          setSchedule({
            ...DEFAULT_REP_SCHEDULE,
            ...dr.repSchedule,
          });
        }
      } catch (err) {
        console.error('Error fetching doctor schedule:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDoctorSchedule();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaveError('');
    setSaveSuccess(false);

    if (!hasConfiguredHours(schedule.weekly)) {
      setSaveError('You must configure at least one day with visit hours.');
      return;
    }

    setSaving(true);
    try {
      await updateDoctor(user.uid, {
        repSchedule: schedule,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving schedule:', err);
      setSaveError('Failed to save schedule. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-4 font-sans">
        <Skeleton className="w-48 h-8 rounded-[0.75rem]" />
        <Skeleton className="w-full h-96 rounded-[1.25rem]" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 font-sans selection:bg-amber-100 selection:text-sand-600 pb-20">
      
      {/* Top Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-[0.75rem] bg-white border border-line text-ink hover:bg-cream-50 transition-colors shadow-sm"
            title="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-ink">Rep Visit Schedule</h1>
            <p className="text-xs text-ink-soft">Control when medical representatives can book consultation slots.</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !hasConfiguredHours(schedule.weekly)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-navy-900 hover:bg-navy-700 text-white rounded-[0.875rem] text-xs font-bold transition-all shadow-sm active:scale-[0.99] disabled:opacity-50"
        >
          {saving ? (
            'Saving...'
          ) : saveSuccess ? (
            <>
              <Check className="w-3.5 h-3.5 text-teal-50" /> Saved!
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5 text-amber-500" /> Save Schedule
            </>
          )}
        </button>
      </div>

      {saveSuccess && (
        <div className="mb-4 p-3.5 rounded-[0.875rem] bg-teal-50 border border-teal-600/30 text-teal-600 text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4" /> Schedule updated successfully! Reps will now see these slots.
        </div>
      )}

      {saveError && (
        <div className="mb-4 p-3.5 rounded-[0.875rem] bg-coral-50 border border-coral-600/30 text-coral-600 text-xs font-semibold">
          {saveError}
        </div>
      )}

      <EdgeCard edge="navy" className="p-5 sm:p-6">
        <RepScheduleEditor
          schedule={schedule}
          onChange={setSchedule}
        />
      </EdgeCard>

    </div>
  );
}
