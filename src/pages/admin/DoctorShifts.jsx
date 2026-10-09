import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/auth';
import { handleFirestoreError, OperationType } from '../../utils/firebaseErrors';
import { 
  Clock, Plus, Edit2, Trash2, Sun, Sunset, Moon, Sparkles, 
  Check, X, Building2, Calendar, Users, ShieldAlert, CheckCircle2 
} from 'lucide-react';
import { ToggleSwitch } from '../../components/ui/ToggleSwitch';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const DEFAULT_PRESETS = [
  {
    id: 'preset-morning',
    title: 'Morning Shift',
    category: 'Morning',
    startTime: '09:00',
    endTime: '12:00',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    maxQuota: 5,
    clinicId: 'all',
    active: true,
  },
  {
    id: 'preset-afternoon',
    title: 'Afternoon Shift',
    category: 'Afternoon',
    startTime: '13:00',
    endTime: '16:00',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    maxQuota: 4,
    clinicId: 'all',
    active: true,
  },
  {
    id: 'preset-evening',
    title: 'Evening Shift',
    category: 'Evening',
    startTime: '17:00',
    endTime: '20:00',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    maxQuota: 5,
    clinicId: 'all',
    active: true,
  },
  {
    id: 'preset-night',
    title: 'Night Shift',
    category: 'Night',
    startTime: '20:00',
    endTime: '22:00',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    maxQuota: 3,
    clinicId: 'all',
    active: true,
  }
];

export default function DoctorShifts() {
  const { user } = useAuth();
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [activeDayTab, setActiveDayTab] = useState('All');

  // Form state
  const [form, setForm] = useState({
    title: '',
    category: 'Morning',
    startTime: '09:00',
    endTime: '12:00',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    maxQuota: 5,
    clinicId: 'all',
    active: true,
  });

  useEffect(() => {
    async function loadShifts() {
      if (!user) return;
      try {
        const snap = await getDoc(doc(db, 'doctors', user.uid));
        if (snap.exists() && snap.data().shifts && snap.data().shifts.length > 0) {
          setShifts(snap.data().shifts);
        } else {
          // Default initial presets if none configured yet
          setShifts(DEFAULT_PRESETS);
        }
      } catch (err) {
        console.error("Error loading shifts:", err);
      } finally {
        setLoading(false);
      }
    }
    loadShifts();
  }, [user]);

  const saveShiftsToDb = async (newShifts) => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'doctors', user.uid), {
        shifts: newShifts,
        shiftsUpdatedAt: new Date(),
      });
      setShifts(newShifts);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'doctors');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingShift(null);
    setForm({
      title: 'Morning Shift',
      category: 'Morning',
      startTime: '09:00',
      endTime: '12:00',
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      maxQuota: 5,
      clinicId: 'all',
      active: true,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (shift) => {
    setEditingShift(shift);
    setForm({
      title: shift.title || '',
      category: shift.category || 'Morning',
      startTime: shift.startTime || '09:00',
      endTime: shift.endTime || '12:00',
      days: shift.days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      maxQuota: shift.maxQuota || 5,
      clinicId: shift.clinicId || 'all',
      active: shift.active !== undefined ? shift.active : true,
    });
    setShowModal(true);
  };

  const handleSaveModal = async () => {
    if (!form.title || !form.startTime || !form.endTime) return;

    let updatedList = [];
    if (editingShift) {
      updatedList = shifts.map(s => s.id === editingShift.id ? { ...s, ...form } : s);
    } else {
      const newShift = {
        id: `shift-${Date.now()}`,
        ...form
      };
      updatedList = [...shifts, newShift];
    }

    await saveShiftsToDb(updatedList);
    setShowModal(false);
  };

  const handleDeleteShift = async (id) => {
    if (!confirm('Are you sure you want to remove this shift window?')) return;
    const updated = shifts.filter(s => s.id !== id);
    await saveShiftsToDb(updated);
  };

  const toggleShiftActive = async (id) => {
    const updated = shifts.map(s => s.id === id ? { ...s, active: !s.active } : s);
    await saveShiftsToDb(updated);
  };

  const addPreset = async (preset) => {
    const exists = shifts.some(s => s.title === preset.title);
    if (exists) {
      alert(`The preset "${preset.title}" is already in your shifts list.`);
      return;
    }
    const newShift = { ...preset, id: `preset-${Date.now()}` };
    await saveShiftsToDb([...shifts, newShift]);
  };

  const toggleDayInForm = (day) => {
    setForm(prev => {
      const currentDays = prev.days || [];
      if (currentDays.includes(day)) {
        return { ...prev, days: currentDays.filter(d => d !== day) };
      } else {
        return { ...prev, days: [...currentDays, day] };
      }
    });
  };

  const formatTime12h = (time24) => {
    if (!time24) return '';
    const [hStr, mStr] = time24.split(':');
    let h = parseInt(hStr, 10);
    const m = mStr || '00';
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  };

  const getCategoryBadge = (category) => {
    switch (category) {
      case 'Morning':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80"><Sun className="w-3.5 h-3.5 text-amber-500" /> Morning</span>;
      case 'Afternoon':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-orange-50 text-orange-700 border border-orange-200/80"><Sun className="w-3.5 h-3.5 text-orange-500" /> Afternoon</span>;
      case 'Evening':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80"><Sunset className="w-3.5 h-3.5 text-indigo-500" /> Evening</span>;
      case 'Night':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200/80"><Moon className="w-3.5 h-3.5 text-purple-500" /> Night</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80"><Clock className="w-3.5 h-3.5 text-emerald-500" /> Custom</span>;
    }
  };

  if (loading) {
    return <div className="text-gray-500 font-medium font-sans flex items-center gap-2 p-6">Loading Shift Manager...</div>;
  }

  const filteredShifts = activeDayTab === 'All' 
    ? shifts 
    : shifts.filter(s => s.days?.includes(activeDayTab));

  return (
    <div className="pb-16 max-w-4xl mx-auto font-sans selection:bg-emerald-100 animate-in fade-in duration-500">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-10 h-10 rounded-[1rem] bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-display font-black text-premium-900 tracking-tight leading-tight">Multi-Slot Shift Manager</h1>
          </div>
          <p className="text-gray-500 font-medium text-sm mt-1">
            Define recurring availability windows (Morning, Afternoon, Evening) for medical representative visits.
          </p>
        </div>

        <button 
          onClick={handleOpenAdd}
          className="bg-premium-900 text-white px-5 py-3.5 rounded-[1.25rem] font-bold text-[14px] flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(15,23,42,0.2)] hover:bg-black transition-all active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Custom Shift
        </button>
      </div>

      {/* Preset Quick Add Section */}
      <div className="bg-gradient-to-br from-emerald-900 to-premium-900 rounded-[2rem] p-6 text-white mb-8 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex items-center gap-2 mb-2 text-emerald-400 font-bold text-xs uppercase tracking-widest">
          <Sparkles className="w-4 h-4" /> Quick Shift Presets
        </div>
        <h2 className="text-xl font-display font-bold tracking-tight mb-4">One-Tap Standard Shifts</h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {DEFAULT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => addPreset(preset)}
              className="bg-white/10 hover:bg-white/20 border border-white/15 rounded-2xl p-3.5 text-left transition-all active:scale-95 group flex flex-col justify-between"
            >
              <div>
                <span className="text-xs font-bold text-white/90 group-hover:text-white block truncate">{preset.title}</span>
                <span className="text-[11px] text-emerald-300/80 font-mono font-medium block mt-1">
                  {formatTime12h(preset.startTime)} - {formatTime12h(preset.endTime)}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-[10px] text-white/60 font-semibold uppercase tracking-wider">
                <span>{preset.maxQuota} Reps Max</span>
                <Plus className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-125 transition-transform" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Day Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-6 -mx-2 px-2">
        <button
          onClick={() => setActiveDayTab('All')}
          className={`px-4 py-2.5 rounded-[1rem] font-bold text-xs tracking-wider uppercase transition-all whitespace-nowrap ${
            activeDayTab === 'All'
              ? 'bg-premium-900 text-white shadow-sm'
              : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'
          }`}
        >
          All Shifts ({shifts.length})
        </button>
        {DAYS.map(day => {
          const count = shifts.filter(s => s.days?.includes(day)).length;
          return (
            <button
              key={day}
              onClick={() => setActiveDayTab(day)}
              className={`px-3.5 py-2.5 rounded-[1rem] font-bold text-xs tracking-wider uppercase transition-all whitespace-nowrap ${
                activeDayTab === day
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'
              }`}
            >
              {day} {count > 0 && `(${count})`}
            </button>
          );
        })}
      </div>

      {/* Shifts List */}
      {filteredShifts.length === 0 ? (
        <div className="bg-white rounded-[2rem] border border-gray-100 border-dashed p-12 text-center">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-display font-bold text-premium-900 text-lg">No Shift Windows Found</h3>
          <p className="text-gray-400 text-sm mt-1 mb-6">
            {activeDayTab === 'All' ? 'You haven\'t configured any availability slots.' : `No active shift slots on ${activeDayTab}.`}
          </p>
          <button
            onClick={handleOpenAdd}
            className="bg-premium-900 text-white font-bold px-6 py-3 rounded-xl text-sm shadow-sm hover:bg-black transition-all"
          >
            Create Shift Window
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredShifts.map((shift) => (
            <div
              key={shift.id}
              className={`bg-white rounded-[1.75rem] p-6 shadow-[0_4px_20px_rgb(0,0,0,0.02)] border transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.05)] ${
                shift.active ? 'border-gray-100' : 'border-gray-200/60 opacity-60 bg-gray-50/50'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="font-display font-bold text-premium-900 text-lg">{shift.title}</h3>
                    {getCategoryBadge(shift.category)}
                    <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                      shift.active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {shift.active ? 'Active' : 'Disabled'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm font-semibold text-gray-600 flex-wrap">
                    <div className="flex items-center gap-1.5 font-mono text-emerald-800 bg-emerald-50/80 px-3 py-1 rounded-lg border border-emerald-200/50">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      {formatTime12h(shift.startTime)} – {formatTime12h(shift.endTime)}
                    </div>

                    <div className="flex items-center gap-1.5 text-gray-500">
                      <Users className="w-4 h-4 text-gray-400" />
                      Quota: <span className="font-bold text-premium-900">{shift.maxQuota || 5} Reps</span>
                    </div>
                  </div>

                  {/* Days Chips */}
                  <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                    {DAYS.map((d) => {
                      const isIncluded = shift.days?.includes(d);
                      return (
                        <span
                          key={d}
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            isIncluded
                              ? 'bg-premium-900 text-white'
                              : 'bg-gray-100 text-gray-300'
                          }`}
                        >
                          {d}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 self-end sm:self-center border-t sm:border-t-0 pt-3 sm:pt-0 w-full sm:w-auto justify-between sm:justify-end">
                  <ToggleSwitch
                    label=""
                    checked={shift.active}
                    onChange={() => toggleShiftActive(shift.id)}
                  />

                  <button
                    onClick={() => handleOpenEdit(shift)}
                    className="p-2.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                    title="Edit Shift"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteShift(shift.id)}
                    className="p-2.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                    title="Delete Shift"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-premium-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-xl font-display font-black text-premium-900">
                {editingShift ? 'Edit Shift Window' : 'Create New Shift Window'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-premium-900 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Title */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Shift Name *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Morning OPD Shift"
                  className="w-full border border-gray-200 rounded-[1rem] px-4 py-3.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white font-medium text-premium-900 outline-none text-sm"
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Window Category</label>
                <div className="grid grid-cols-4 gap-2">
                  {['Morning', 'Afternoon', 'Evening', 'Night'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setForm({ ...form, category: cat })}
                      className={`py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border ${
                        form.category === cat
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Start Time *</label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={e => setForm({ ...form, startTime: e.target.value })}
                    className="w-full border border-gray-200 rounded-[1rem] px-4 py-3.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white font-medium text-premium-900 outline-none text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">End Time *</label>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={e => setForm({ ...form, endTime: e.target.value })}
                    className="w-full border border-gray-200 rounded-[1rem] px-4 py-3.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white font-medium text-premium-900 outline-none text-sm"
                  />
                </div>
              </div>

              {/* Days Selection */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Active Days</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] })}
                      className="text-[10px] font-bold text-emerald-600 hover:underline uppercase"
                    >
                      Weekdays
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, days: [...DAYS] })}
                      className="text-[10px] font-bold text-emerald-600 hover:underline uppercase"
                    >
                      All
                    </button>
                  </div>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {DAYS.map(day => {
                    const isSelected = form.days?.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDayInForm(day)}
                        className={`flex-1 min-w-[42px] py-2.5 rounded-xl text-xs font-bold transition-all border ${
                          isSelected
                            ? 'bg-premium-900 text-white border-premium-900 shadow-sm'
                            : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Rep Quota */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Max Rep Quota per Slot</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={form.maxQuota}
                    onChange={e => setForm({ ...form, maxQuota: parseInt(e.target.value, 10) || 1 })}
                    className="w-28 border border-gray-200 rounded-[1rem] px-4 py-3 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white font-bold text-premium-900 outline-none text-base text-center"
                  />
                  <span className="text-xs text-gray-500 font-medium">Representatives allowed per appointment window</span>
                </div>
              </div>

              {/* Active Toggle */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-premium-900">Shift Status</p>
                  <p className="text-xs text-gray-500">Enable this slot for booking approvals</p>
                </div>
                <ToggleSwitch
                  label=""
                  checked={form.active}
                  onChange={(val) => setForm({ ...form, active: val })}
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50/50 mt-auto">
              <button
                onClick={handleSaveModal}
                disabled={saving || !form.title}
                className="w-full bg-premium-900 text-white font-bold py-4 rounded-[1.25rem] hover:bg-black transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 text-[15px] disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Shift Window'} <Check className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
