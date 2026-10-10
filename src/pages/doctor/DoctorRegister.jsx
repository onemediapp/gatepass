import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUser } from '../../lib/db/users';
import { createDoctor } from '../../lib/db/doctors';
import { setDoctorContact } from '../../lib/db/doctorContacts';
import { createClinic } from '../../lib/db/clinics';
import { linkDoctorClinic } from '../../lib/db/doctorClinics';
import { setDoctorSlug } from '../../lib/db/doctorSlugs';
import { useAuth } from '../../lib/auth';
import { handleFirestoreError, OperationType } from '../../utils/firebaseErrors';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { PhoneInput } from '../../components/ui/PhoneInput';
import { Stethoscope, Building2, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

const specialtyOptions = [
  { value: 'General Physician', label: 'General Physician' },
  { value: 'Cardiologist', label: 'Cardiologist' },
  { value: 'Diabetologist', label: 'Diabetologist' },
  { value: 'Orthopedic Surgeon', label: 'Orthopedic Surgeon' },
  { value: 'Pediatrician', label: 'Pediatrician' },
  { value: 'Gynecologist', label: 'Gynecologist' },
  { value: 'Dermatologist', label: 'Dermatologist' },
  { value: 'Neurologist', label: 'Neurologist' },
  { value: 'Psychiatrist', label: 'Psychiatrist' },
  { value: 'Oncologist', label: 'Oncologist' },
  { value: 'Gastroenterologist', label: 'Gastroenterologist' },
  { value: 'Pulmonologist', label: 'Pulmonologist' },
  { value: 'Ophthalmologist', label: 'Ophthalmologist' },
  { value: 'ENT Specialist', label: 'ENT Specialist' },
  { value: 'Dentist', label: 'Dentist' },
];

const stateOptions = [
  { value: 'Andhra Pradesh', label: 'Andhra Pradesh' },
  { value: 'Delhi', label: 'Delhi' },
  { value: 'Karnataka', label: 'Karnataka' },
  { value: 'Maharashtra', label: 'Maharashtra' },
  { value: 'Tamil Nadu', label: 'Tamil Nadu' },
  { value: 'Telangana', label: 'Telangana' },
  { value: 'Other', label: 'Other' },
];

function generateSlug(text) {
  return text.toString().toLowerCase().trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

export default function DoctorRegister() {
  const navigate = useNavigate();
  const { user, setUserData } = useAuth();
  
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clinicOption, setClinicOption] = useState('A'); 
  
  // Profile State
  const [profileData, setProfileData] = useState({
    specialty: '',
    qualifications: '',
    regNumber: '',
    experience: '',
    city: '',
    state: '',
    mobile: '',
  });

  // Clinic State
  const [clinicData, setClinicData] = useState({
    clinicName: '',
    address: '',
    phone: '',
    repHours: '',
  });

  const updateProfile = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const updateClinic = (field, value) => {
    setClinicData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step === 1) {
      if (!profileData.specialty || !profileData.qualifications || !profileData.city || profileData.mobile.length < 10) return;
    }
    setStep(prev => prev + 1);
  };

  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);
    
    try {
      const generatedUserData = {
        name: user.displayName || 'Doctor',
        email: user.email || '',
        photoUrl: user.photoURL || '',
        mobile: profileData.mobile,
        role: ['doctor'],
        isActive: true,
      };
      await createUser(user.uid, generatedUserData);

      let createdClinicId = null;

      if (clinicOption === 'A' && clinicData.clinicName && clinicData.address) {
        let baseSlug = generateSlug(`${clinicData.clinicName}-${profileData.city}`);
        createdClinicId = await createClinic({
          clinicName: clinicData.clinicName,
          address: clinicData.address,
          city: profileData.city,
          state: profileData.state,
          phone: clinicData.phone,
          slug: baseSlug,
          ownerDoctorId: user.uid,
          qrCodeData: `${window.location.origin}/clinic/${baseSlug}`,
          isActive: true
        });

        await linkDoctorClinic(user.uid, createdClinicId);
      }

      if (profileData.mobile) {
        await setDoctorContact(user.uid, {
          whatsappNumber: profileData.mobile,
          phone: profileData.mobile
        });
      }

      const drSlug = generateSlug(user.displayName || 'doctor') + '-' + user.uid.slice(0, 4);
      await setDoctorSlug(drSlug, user.uid);

      await createDoctor(user.uid, {
        uid: user.uid,
        name: user.displayName || 'Doctor',
        specialty: profileData.specialty,
        qualifications: profileData.qualifications,
        regNumber: profileData.regNumber || '',
        yearsExperience: Number(profileData.experience || 0),
        city: profileData.city,
        state: profileData.state,
        clinicIds: createdClinicId ? [createdClinicId] : [],
        profileSlug: drSlug,
        privacy: {
          visibleInSearch: true,
          showFullName: true,
          showSpecialty: true,
          showCity: true,
          showClinicName: true,
          showRepHours: true,
          allowAppointmentRequest: true,
          allowWhatsAppRedirect: true,
          rejectionReasonsEnabled: true
        }
      });
      
      setUserData(generatedUserData);
      navigate('/admin/settings');
      
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}`);
      setIsSubmitting(false);
    }
  };

  const stepIcons = [Stethoscope, Building2];
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
                Step {step} of 2
              </p>
            </div>
          </div>
        </div>
        <div className="max-w-md mx-auto mt-6 h-1.5 bg-premium-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-premium-900 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{ width: `${(step / 2) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex-1 max-w-md w-full mx-auto p-6 sm:p-8 flex flex-col pt-10 relative z-10">
        {step === 1 && (
          <div className="space-y-8 animate-in slide-in-from-right-8 fade-in duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
            <div>
              <h2 className="text-[2rem] leading-none font-display font-black text-premium-900 tracking-tight">Professional ID</h2>
              <p className="text-gray-500 mt-2 font-medium">Let's set up your clinical identity.</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Specialty <span className="text-red-500">*</span></label>
                <div className="bg-white rounded-[1rem] border border-gray-200 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 shadow-sm transition-all p-1">
                  <SearchableSelect 
                    options={specialtyOptions}
                    value={profileData.specialty}
                    onChange={(val) => updateProfile('specialty', val)}
                    placeholder="Select primary specialty"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Qualifications <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  className="w-full border border-gray-200 rounded-[1rem] px-5 py-4 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white shadow-sm outline-none font-medium text-premium-900 placeholder:text-gray-400 transition-all text-[15px]"
                  placeholder="e.g. MBBS, MD (Medicine)"
                  value={profileData.qualifications}
                  onChange={(e) => updateProfile('qualifications', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Reg Number <span className="text-gray-300 font-medium">(Opt)</span></label>
                  <input 
                    type="text" 
                    className="w-full border border-gray-200 rounded-[1rem] px-5 py-4 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white shadow-sm outline-none font-medium text-premium-900 placeholder:text-gray-400 transition-all text-[15px]"
                    placeholder="e.g. 12345"
                    value={profileData.regNumber}
                    onChange={(e) => updateProfile('regNumber', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Experience</label>
                  <input 
                    type="number" 
                    className="w-full border border-gray-200 rounded-[1rem] px-5 py-4 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white shadow-sm outline-none font-medium text-premium-900 placeholder:text-gray-400 transition-all text-[15px]"
                    placeholder="Years"
                    value={profileData.experience}
                    onChange={(e) => updateProfile('experience', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">City <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    className="w-full border border-gray-200 rounded-[1rem] px-5 py-4 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white shadow-sm outline-none font-medium text-premium-900 placeholder:text-gray-400 transition-all text-[15px]"
                    placeholder="e.g. Mumbai"
                    value={profileData.city}
                    onChange={(e) => updateProfile('city', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">State <span className="text-red-500">*</span></label>
                  <div className="bg-white rounded-[1rem] border border-gray-200 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 shadow-sm transition-all p-1">
                    <SearchableSelect 
                      options={stateOptions}
                      value={profileData.state}
                      onChange={(val) => updateProfile('state', val)}
                      placeholder="Select state"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Mobile / WhatsApp <span className="text-red-500">*</span></label>
                <div className="bg-white rounded-[1rem] shadow-sm border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
                  <PhoneInput 
                    value={profileData.mobile}
                    onChange={(val) => updateProfile('mobile', val)}
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
              <h2 className="text-[2rem] leading-none font-display font-black text-premium-900 tracking-tight">Clinic Details</h2>
              <p className="text-gray-500 mt-2 font-medium">Where will reps visit you?</p>
            </div>

            <div className="flex bg-premium-100 p-1.5 rounded-[1rem] mb-8 shadow-inner border border-gray-100">
              <button 
                onClick={() => setClinicOption('A')}
                className={cn("flex-1 py-3 text-[13px] font-bold rounded-[0.75rem] transition-all", clinicOption === 'A' ? "bg-white shadow-[0_2px_10px_rgb(0,0,0,0.06)] text-emerald-600" : "text-gray-500 hover:text-gray-700")}
              >
                Create New
              </button>
              <button 
                onClick={() => setClinicOption('C')}
                className={cn("flex-1 py-3 text-[13px] font-bold rounded-[0.75rem] transition-all", clinicOption === 'C' ? "bg-white shadow-[0_2px_10px_rgb(0,0,0,0.06)] text-premium-900" : "text-gray-500 hover:text-gray-700")}
              >
                Skip right now
              </button>
            </div>

            {clinicOption === 'A' && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Clinic Name <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    className="w-full border border-gray-200 rounded-[1rem] px-5 py-4 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white shadow-sm outline-none font-medium text-premium-900 placeholder:text-gray-400 transition-all text-[15px]"
                    placeholder="e.g. Apollo Diabetes Clinic"
                    value={clinicData.clinicName}
                    onChange={(e) => updateClinic('clinicName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Full Address <span className="text-red-500">*</span></label>
                  <textarea 
                    className="w-full border border-gray-200 rounded-[1rem] px-5 py-4 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white shadow-sm outline-none resize-none min-h-[100px] font-medium text-premium-900 placeholder:text-gray-400 transition-all text-[15px]"
                    placeholder="Enter complete address"
                    value={clinicData.address}
                    onChange={(e) => updateClinic('address', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1 flex justify-between">
                    <span>Clinic Phone</span>
                    <span className="text-gray-300">(Opt)</span>
                  </label>
                  <div className="bg-white rounded-[1rem] shadow-sm border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
                    <PhoneInput 
                      value={clinicData.phone}
                      onChange={(val) => updateClinic('phone', val)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1 flex justify-between">
                    <span>Rep Visiting Hours</span>
                    <span className="text-gray-300">(Opt)</span>
                  </label>
                  <input 
                    type="text" 
                    className="w-full border border-gray-200 rounded-[1rem] px-5 py-4 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white shadow-sm outline-none font-medium text-premium-900 placeholder:text-gray-400 transition-all text-[15px]"
                    placeholder="e.g. 2:00 PM - 4:00 PM (Mon-Fri)"
                    value={clinicData.repHours}
                    onChange={(e) => updateClinic('repHours', e.target.value)}
                  />
                </div>
              </div>
            )}
            
            {clinicOption === 'C' && (
              <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-[1.25rem] text-emerald-900 text-[14px]">
                <p className="font-bold mb-2">Are you sure?</p>
                <p className="font-medium text-emerald-800/80 leading-relaxed">You can set up your clinic later from the dashboard. Reps won't be able to book appointments with you until you add a clinic.</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-12 pt-8 pb-4 flex gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep(1)}
              className="flex-shrink-0 bg-white text-gray-700 border border-gray-200 font-bold rounded-[1.25rem] w-14 h-14 hover:bg-premium-50 transition-all active:scale-95 flex items-center justify-center shadow-sm hover:border-gray-300"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          
          {step === 1 ? (
            <button
              onClick={handleNext}
              disabled={!profileData.specialty || !profileData.qualifications || !profileData.city || profileData.mobile.length < 10}
              className="flex-1 bg-premium-900 text-white font-bold rounded-[1.25rem] px-6 py-4 hover:bg-black transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-30 disabled:active:scale-100 shadow-[0_4px_14px_rgba(15,23,42,0.2)] text-[15px]"
            >
              Continue <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || (clinicOption === 'A' && (!clinicData.clinicName || !clinicData.address))}
              className="flex-1 bg-emerald-600 text-white font-bold rounded-[1.25rem] px-6 py-4 transition-all active:scale-[0.98] hover:bg-emerald-700 flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_4px_14px_rgba(5,150,105,0.3)] text-[15px]"
            >
              {isSubmitting ? 'Saving...' : 'Finish Setup'} <Check className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
