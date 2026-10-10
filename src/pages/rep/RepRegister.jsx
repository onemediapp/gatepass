import { useState } from 'react';
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
    // Basic validation
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
    <div className="min-h-screen bg-premium-50 flex flex-col font-sans selection:bg-emerald-100">
      <div className="bg-white/80 backdrop-blur-2xl px-6 py-5 shadow-[0_4px_40px_rgb(0,0,0,0.03)] flex-shrink-0 sticky top-0 z-20 border-b border-gray-100">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[1rem] bg-premium-900 flex items-center justify-center text-white shadow-sm">
              <StepIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-display font-black text-premium-900 leading-none text-xl tracking-tight">Setup Profile</h1>
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">
                Step {step} of 3
              </p>
            </div>
          </div>
        </div>
        <div className="max-w-md mx-auto mt-6 h-1.5 bg-premium-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-premium-900 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex-1 max-w-md w-full mx-auto p-6 sm:p-8 flex flex-col pt-10 relative z-10">
        {step === 1 && (
          <div className="space-y-8 animate-in slide-in-from-right-8 fade-in duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
            <div>
              <h2 className="text-[2rem] leading-none font-display font-black text-premium-900 tracking-tight">Professional ID</h2>
              <p className="text-gray-500 mt-2 font-medium">Let's set up your primary identity.</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Company Name <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  className="w-full border border-gray-200 rounded-[1rem] px-5 py-4 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white shadow-sm outline-none font-medium text-premium-900 placeholder:text-gray-400 transition-all text-[15px]"
                  placeholder="e.g. Sun Pharma"
                  value={formData.companyName}
                  onChange={(e) => updateForm('companyName', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Division / Brand Team</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-200 rounded-[1rem] px-5 py-4 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white shadow-sm outline-none font-medium text-premium-900 placeholder:text-gray-400 transition-all text-[15px]"
                  placeholder="e.g. Cardio-Diab"
                  value={formData.division}
                  onChange={(e) => updateForm('division', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Designation <span className="text-red-500">*</span></label>
                <div className="bg-white rounded-[1rem] border border-gray-200 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 shadow-sm transition-all p-1">
                  <SearchableSelect 
                    options={designationOptions}
                    value={formData.designation}
                    onChange={(val) => updateForm('designation', val)}
                    placeholder="Select designation"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Mobile / WhatsApp Number <span className="text-red-500">*</span></label>
                <div className="bg-white rounded-[1rem] shadow-sm border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
                  <PhoneInput 
                    value={formData.mobile}
                    onChange={(val) => updateForm('mobile', val)}
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-in slide-in-from-right-8 fade-in duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
            <div>
              <h2 className="text-[2rem] leading-none font-display font-black text-premium-900 tracking-tight">Portfolio</h2>
              <p className="text-gray-500 mt-2 font-medium">What do you typically discuss with doctors?</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Primary Therapeutic Category <span className="text-red-500">*</span></label>
                <div className="bg-white rounded-[1rem] border border-gray-200 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 shadow-sm transition-all p-1">
                  <SearchableSelect 
                    options={therapeuticOptions}
                    value={formData.therapeuticCategory}
                    onChange={(val) => updateForm('therapeuticCategory', val)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Secondary Category <span className="text-gray-300 font-medium">(Opt)</span></label>
                <div className="bg-white rounded-[1rem] border border-gray-200 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 shadow-sm transition-all p-1">
                  <SearchableSelect 
                    options={therapeuticOptions.filter(o => o.value !== formData.therapeuticCategory)}
                    value={formData.therapeuticCategory2}
                    onChange={(val) => updateForm('therapeuticCategory2', val)}
                    placeholder="Select secondary category"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Key Brands You Carry <span className="text-red-500">*</span></label>
                <div className="bg-white rounded-[1rem] border border-gray-200 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 shadow-sm transition-all p-1">
                  <TagInput 
                    tags={formData.productNames}
                    onChange={(tags) => updateForm('productNames', tags)}
                    placeholder="Type brand name & press Enter"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Key Molecules</label>
                <textarea 
                  className="w-full border border-gray-200 rounded-[1rem] px-5 py-4 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white shadow-sm outline-none resize-none min-h-[80px] font-medium text-premium-900 placeholder:text-gray-400 transition-all text-[15px]"
                  placeholder="e.g. Metformin, Sitagliptin..."
                  value={formData.molecules}
                  onChange={(e) => updateForm('molecules', e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Dosage Forms</label>
                <div className="flex flex-wrap gap-2">
                  {dosageFormsList.map(form => (
                    <button
                      key={form}
                      type="button"
                      onClick={() => toggleDosageForm(form)}
                      className={cn(
                        "px-4 py-2 rounded-[0.75rem] text-[13px] font-bold transition-all border outline-none",
                        formData.dosageForms.includes(form)
                          ? "bg-premium-900 text-white border-premium-900 shadow-sm"
                          : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                      )}
                    >
                      {form}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 pb-2">
                <div className="bg-white rounded-[1.25rem] shadow-sm border border-gray-200 overflow-hidden px-6 py-4">
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
          <div className="space-y-8 animate-in slide-in-from-right-8 fade-in duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
            <div>
              <h2 className="text-[2rem] leading-none font-display font-black text-premium-900 tracking-tight">Final Details</h2>
              <p className="text-gray-500 mt-2 font-medium">Optional company info for your profile.</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Company Regional Office</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-200 rounded-[1rem] px-5 py-4 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white shadow-sm outline-none font-medium text-premium-900 placeholder:text-gray-400 transition-all text-[15px]"
                  placeholder="e.g. Mumbai, Maharashtra"
                  value={formData.companyOffice}
                  onChange={(e) => updateForm('companyOffice', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Medical Information Helpline</label>
                <div className="bg-white rounded-[1rem] shadow-sm border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
                  <PhoneInput 
                    value={formData.medInfoHelpline}
                    onChange={(val) => updateForm('medInfoHelpline', val)}
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 bg-premium-900 p-[1.5px] rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
              <div className="bg-white rounded-[1.45rem] p-6">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Profile Preview</p>
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-14 h-14 bg-premium-50 rounded-[1rem] overflow-hidden flex-shrink-0 shadow-inner flex items-center justify-center border border-gray-100">
                    {user?.photoURL ? (
                      <img src={user?.photoURL} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-display font-black text-xl text-emerald-600">{user?.displayName?.charAt(0) || 'U'}</span>
                    )}
                  </div>
                  <div className="pt-1 overflow-hidden">
                    <h3 className="font-bold text-premium-900 text-lg leading-tight truncate">{user?.displayName || 'User Name'}</h3>
                    <p className="text-gray-500 font-medium text-sm truncate">{formData.designation || 'Designation'} · {formData.companyName || 'Company'}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-emerald-50 text-emerald-700 text-[9px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded-md border border-emerald-100">
                    {formData.therapeuticCategory || 'Category'}
                  </span>
                  {formData.samplesAvailable && (
                    <span className="bg-emerald-50 text-emerald-700 text-[9px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded-md border border-emerald-200/60">
                      Has Samples
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-12 pt-8 pb-4 flex gap-3">
          {step > 1 && (
            <button
              onClick={handleBack}
              className="flex-shrink-0 bg-white text-gray-700 border border-gray-200 font-bold rounded-[1.25rem] w-14 h-14 hover:bg-gray-50 transition-all active:scale-95 flex items-center justify-center shadow-sm"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          
          {step < 3 ? (
            <button
              onClick={handleNext}
              disabled={
                (step === 1 && (!formData.companyName || !formData.designation || formData.mobile.length < 10)) ||
                (step === 2 && (!formData.therapeuticCategory || formData.productNames.length === 0))
              }
              className="flex-1 bg-premium-900 text-white font-bold rounded-[1.25rem] px-6 py-4 hover:bg-black transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-30 disabled:active:scale-100 shadow-[0_4px_14px_rgba(15,23,42,0.2)] text-[15px]"
            >
              Continue <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 bg-emerald-600 text-white font-bold rounded-[1.25rem] px-6 py-4 transition-all active:scale-[0.98] hover:bg-emerald-700 flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_4px_14px_rgba(5,150,105,0.3)] text-[15px]"
            >
              {isSubmitting ? 'Saving...' : 'Complete Profile'} <Check className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
