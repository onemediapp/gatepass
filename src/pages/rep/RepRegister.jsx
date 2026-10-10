import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUser } from '../../lib/db/users';
import { createRep } from '../../lib/db/reps';
import { useAuth } from '../../lib/auth';
import { handleFirestoreError, OperationType } from '../../utils/firebaseErrors';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { TagInput } from '../../components/ui/TagInput';
import { PhoneInput } from '../../components/ui/PhoneInput';
import { ToggleSwitch } from '../../components/ui/ToggleSwitch';
import { ChevronRight, ChevronLeft, Briefcase, Pill, Building2, Check } from 'lucide-react';
import EdgeCard from '../../components/ui/EdgeCard';
import MonoTag from '../../components/ui/MonoTag';
import { cn } from '../../lib/utils';

const designationOptions = [
  { value: 'MR', label: 'Medical Representative (MR)' },
  { value: 'AM', label: 'Area Manager (AM)' },
  { value: 'RM', label: 'Regional Manager (RM)' },
  { value: 'ZM', label: 'Zonal Manager (ZM)' },
  { value: 'Hospital Marketing', label: 'Hospital Marketing' },
  { value: 'KAM', label: 'Key Account Manager (KAM)' },
  { value: 'Other', label: 'Other' },
];

const therapeuticOptions = [
  { value: 'Cardiology', label: 'Cardiology' },
  { value: 'Diabetology', label: 'Diabetology' },
  { value: 'General Medicine', label: 'General Medicine' },
  { value: 'Orthopedics', label: 'Orthopedics' },
  { value: 'Pediatrics', label: 'Pediatrics' },
  { value: 'Gynecology', label: 'Gynecology' },
  { value: 'Dermatology', label: 'Dermatology' },
  { value: 'Neurology', label: 'Neurology' },
  { value: 'Psychiatry', label: 'Psychiatry' },
  { value: 'Oncology', label: 'Oncology' },
  { value: 'Gastroenterology', label: 'Gastroenterology' },
  { value: 'Respiratory', label: 'Respiratory / Pulmonology' },
  { value: 'Ophthalmology', label: 'Ophthalmology' },
  { value: 'ENT', label: 'ENT' },
  { value: 'Dentistry', label: 'Dentistry' },
];

const dosageFormsList = ['Tablet', 'Injection', 'Syrup', 'Patch', 'Device', 'Other'];

export default function RepRegister() {
  const navigate = useNavigate();
  const { user, setUserData } = useAuth();
  
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    mobile: '',
    companyName: '',
    division: '',
    designation: '',
    therapeuticCategory: '',
    therapeuticCategory2: '',
    productNames: [],
    molecules: '',
    dosageForms: [],
    samplesAvailable: true,
    companyOffice: '',
    medInfoHelpline: '',
  });

  const updateForm = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleDosageForm = (form) => {
    setFormData(prev => ({
      ...prev,
      dosageForms: prev.dosageForms.includes(form)
        ? prev.dosageForms.filter(f => f !== form)
        : [...prev.dosageForms, form]
    }));
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.companyName || !formData.designation || formData.mobile.length < 10) return;
    }
    if (step === 2) {
      if (!formData.therapeuticCategory || formData.productNames.length === 0) return;
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => setStep(prev => prev - 1);

  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);
    
    try {
      const userData = {
        name: user.displayName || 'Rep',
        email: user.email || '',
        photoUrl: user.photoURL || '',
        mobile: formData.mobile,
        role: ['rep'],
        isActive: true,
      };
      await createUser(user.uid, userData);
      
      const repData = {
        uid: user.uid,
        companyName: formData.companyName,
        companyHistory: [],
        division: formData.division,
        designation: formData.designation,
        therapeuticCategory: formData.therapeuticCategory,
        therapeuticCategory2: formData.therapeuticCategory2 || '',
        productNames: formData.productNames,
        molecules: formData.molecules,
        dosageForms: formData.dosageForms,
        samplesAvailable: formData.samplesAvailable,
        companyOffice: formData.companyOffice || '',
        medInfoHelpline: formData.medInfoHelpline || '',
      };
      await createRep(user.uid, repData);
      
      setUserData(userData);
      navigate('/rep/home');
      
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}`);
      setIsSubmitting(false);
    }
  };

  const stepIcons = [Briefcase, Pill, Building2];
  const StepIcon = stepIcons[step - 1];

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col font-sans selection:bg-amber-100 selection:text-sand-600">
      
      {/* Top Header & Progress */}
      <div className="bg-white px-5 py-4 shadow-sm flex-shrink-0 sticky top-0 z-20 border-b border-line">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[0.75rem] bg-navy-900 flex items-center justify-center text-white shadow-sm">
              <StepIcon className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h1 className="font-display font-bold text-ink leading-none text-lg">Setup Rep Profile</h1>
              <p className="font-mono text-[0.6875rem] font-bold text-teal-600 uppercase tracking-wider mt-1">
                Step {step} of 3
              </p>
            </div>
          </div>
          <MonoTag variant="neutral">MR Pass</MonoTag>
        </div>
        <div className="max-w-md mx-auto mt-4 h-1 bg-line rounded-full overflow-hidden">
          <div 
            className="h-full bg-navy-900 transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex-1 max-w-md w-full mx-auto p-4 sm:p-6 flex flex-col pt-6 relative z-10">
        {step === 1 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
            <div>
              <h2 className="text-2xl font-display font-bold text-ink tracking-tight">Professional ID</h2>
              <p className="text-ink-soft text-sm mt-1">Set up your company and designation identity.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="font-mono text-xs uppercase tracking-wider text-ink-mute font-semibold px-0.5">
                  Company Name <span className="text-coral-600">*</span>
                </label>
                <input 
                  type="text" 
                  className="w-full border border-line rounded-[0.875rem] px-4 py-3 focus:ring-2 focus:ring-navy-100 focus:border-navy-500 bg-white shadow-sm outline-none font-medium text-ink placeholder:text-ink-mute text-sm transition-all"
                  placeholder="e.g. Sun Pharma"
                  value={formData.companyName}
                  onChange={(e) => updateForm('companyName', e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-xs uppercase tracking-wider text-ink-mute font-semibold px-0.5">
                  Division / Brand Team
                </label>
                <input 
                  type="text" 
                  className="w-full border border-line rounded-[0.875rem] px-4 py-3 focus:ring-2 focus:ring-navy-100 focus:border-navy-500 bg-white shadow-sm outline-none font-medium text-ink placeholder:text-ink-mute text-sm transition-all"
                  placeholder="e.g. Cardio-Diab"
                  value={formData.division}
                  onChange={(e) => updateForm('division', e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-xs uppercase tracking-wider text-ink-mute font-semibold px-0.5">
                  Designation <span className="text-coral-600">*</span>
                </label>
                <SearchableSelect 
                  options={designationOptions}
                  value={formData.designation}
                  onChange={(val) => updateForm('designation', val)}
                  placeholder="Select designation"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-xs uppercase tracking-wider text-ink-mute font-semibold px-0.5">
                  Mobile / WhatsApp Number <span className="text-coral-600">*</span>
                </label>
                <PhoneInput 
                  value={formData.mobile}
                  onChange={(val) => updateForm('mobile', val)}
                  required
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
            <div>
              <h2 className="text-2xl font-display font-bold text-ink tracking-tight">Portfolio</h2>
              <p className="text-ink-soft text-sm mt-1">What do you typically detail to doctors?</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="font-mono text-xs uppercase tracking-wider text-ink-mute font-semibold px-0.5">
                  Primary Therapeutic Category <span className="text-coral-600">*</span>
                </label>
                <SearchableSelect 
                  options={therapeuticOptions}
                  value={formData.therapeuticCategory}
                  onChange={(val) => updateForm('therapeuticCategory', val)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-xs uppercase tracking-wider text-ink-mute font-semibold px-0.5">
                  Secondary Category <span className="text-ink-mute font-normal">(Opt)</span>
                </label>
                <SearchableSelect 
                  options={therapeuticOptions.filter(o => o.value !== formData.therapeuticCategory)}
                  value={formData.therapeuticCategory2}
                  onChange={(val) => updateForm('therapeuticCategory2', val)}
                  placeholder="Select secondary category"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-xs uppercase tracking-wider text-ink-mute font-semibold px-0.5">
                  Key Brands You Carry <span className="text-coral-600">*</span>
                </label>
                <TagInput 
                  tags={formData.productNames}
                  onChange={(tags) => updateForm('productNames', tags)}
                  placeholder="Type brand name & press Enter"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-xs uppercase tracking-wider text-ink-mute font-semibold px-0.5">
                  Key Molecules
                </label>
                <textarea 
                  className="w-full border border-line rounded-[0.875rem] px-4 py-3 focus:ring-2 focus:ring-navy-100 focus:border-navy-500 bg-white shadow-sm outline-none resize-none min-h-[5rem] font-medium text-ink placeholder:text-ink-mute text-sm transition-all"
                  placeholder="e.g. Metformin, Sitagliptin..."
                  value={formData.molecules}
                  onChange={(e) => updateForm('molecules', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="font-mono text-xs uppercase tracking-wider text-ink-mute font-semibold px-0.5">
                  Dosage Forms
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {dosageFormsList.map(form => (
                    <button
                      key={form}
                      type="button"
                      onClick={() => toggleDosageForm(form)}
                      className={cn(
                        "px-3 py-1.5 rounded-[0.625rem] text-xs font-mono font-medium transition-all border outline-none",
                        formData.dosageForms.includes(form)
                          ? "bg-navy-900 text-white border-navy-900 shadow-sm"
                          : "bg-white text-ink-soft border-line hover:border-ink-mute"
                      )}
                    >
                      {form}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <div className="bg-white rounded-[1rem] shadow-sm border border-line px-4 py-3">
                  <ToggleSwitch 
                    label="Samples Available"
                    description="I usually carry product samples on my visits."
                    checked={formData.samplesAvailable}
                    onChange={(val) => updateForm('samplesAvailable', val)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
            <div>
              <h2 className="text-2xl font-display font-bold text-ink tracking-tight">Final Details</h2>
              <p className="text-ink-soft text-sm mt-1">Optional office contact information for your profile.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="font-mono text-xs uppercase tracking-wider text-ink-mute font-semibold px-0.5">
                  Company Regional Office
                </label>
                <input 
                  type="text" 
                  className="w-full border border-line rounded-[0.875rem] px-4 py-3 focus:ring-2 focus:ring-navy-100 focus:border-navy-500 bg-white shadow-sm outline-none font-medium text-ink placeholder:text-ink-mute text-sm transition-all"
                  placeholder="e.g. Hyderabad / Vijayawada"
                  value={formData.companyOffice}
                  onChange={(e) => updateForm('companyOffice', e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-xs uppercase tracking-wider text-ink-mute font-semibold px-0.5">
                  Medical Information Helpline
                </label>
                <PhoneInput 
                  value={formData.medInfoHelpline}
                  onChange={(val) => updateForm('medInfoHelpline', val)}
                />
              </div>
            </div>

            {/* Profile Boarding Pass Preview */}
            <div className="mt-6">
              <p className="font-mono text-xs uppercase tracking-wider text-ink-mute font-semibold mb-2">
                Gatepass Preview
              </p>
              <EdgeCard edge="amber" className="p-4">
                <div className="flex items-center gap-3.5 mb-3">
                  <div className="w-12 h-12 bg-navy-100 rounded-[0.75rem] overflow-hidden flex-shrink-0 flex items-center justify-center border border-navy-500/20">
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-display font-bold text-lg text-navy-900">{user?.displayName?.charAt(0) || 'R'}</span>
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="font-bold text-ink text-base truncate">{user?.displayName || 'Pharma Rep'}</h3>
                    <p className="text-ink-soft text-xs truncate">{formData.designation || 'MR'} · {formData.companyName || 'Company'}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <MonoTag variant="neutral">
                    {formData.therapeuticCategory || 'Category'}
                  </MonoTag>
                  {formData.samplesAvailable && (
                    <MonoTag variant="teal">
                      Has Samples
                    </MonoTag>
                  )}
                </div>
              </EdgeCard>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-8 pt-6 pb-4 flex gap-3">
          {step > 1 && (
            <button
              onClick={handleBack}
              className="flex-shrink-0 bg-white text-ink border border-line font-bold rounded-[0.875rem] w-12 h-12 hover:bg-cream-50 transition-all active:scale-95 flex items-center justify-center shadow-sm"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          
          {step < 3 ? (
            <button
              onClick={handleNext}
              disabled={
                (step === 1 && (!formData.companyName || !formData.designation || formData.mobile.length < 10)) ||
                (step === 2 && (!formData.therapeuticCategory || formData.productNames.length === 0))
              }
              className="flex-1 bg-navy-900 text-white font-bold rounded-[0.875rem] px-5 py-3 hover:bg-navy-700 transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-40 shadow-sm text-sm"
            >
              Continue <ChevronRight className="w-4 h-4 text-amber-500" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 bg-navy-900 text-white font-bold rounded-[0.875rem] px-5 py-3 transition-all active:scale-[0.99] hover:bg-navy-700 flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm text-sm"
            >
              {isSubmitting ? 'Saving...' : 'Complete Profile'} <Check className="w-4 h-4 text-teal-50" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
