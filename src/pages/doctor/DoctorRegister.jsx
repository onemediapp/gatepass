/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Stethoscope, 
  Building2, 
  Calendar, 
  ShieldCheck, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Printer, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  Search,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { createUser } from '../../lib/db/users';
import { createDoctor, DEFAULT_REP_SCHEDULE, DEFAULT_DOCTOR_PRIVACY } from '../../lib/db/doctors';
import { setDoctorContact } from '../../lib/db/doctorContacts';
import { createClinic, getClinicBySlug } from '../../lib/db/clinics';
import { linkDoctorClinic } from '../../lib/db/doctorClinics';
import { setDoctorSlug, isSlugAvailable } from '../../lib/db/doctorSlugs';
import { slugify } from '../../lib/ids';
import { hasConfiguredHours, validateDayRanges } from '../../lib/schedule';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { PhoneInput } from '../../components/ui/PhoneInput';
import { ToggleSwitch } from '../../components/ui/ToggleSwitch';
import RepScheduleEditor from '../../components/doctor/RepScheduleEditor';
import EdgeCard from '../../components/ui/EdgeCard';
import MonoTag from '../../components/ui/MonoTag';
import { cn } from '../../lib/utils';

const SPECIALTY_OPTIONS = [
  { value: 'General Physician', label: 'General Physician' },
  { value: 'Cardiologist', label: 'Cardiologist' },
  { value: 'Diabetologist', label: 'Diabetologist / Endocrinologist' },
  { value: 'Orthopedic Surgeon', label: 'Orthopedic Surgeon' },
  { value: 'Pediatrician', label: 'Pediatrician' },
  { value: 'Gynecologist', label: 'Gynecologist & Obstetrician' },
  { value: 'Dermatologist', label: 'Dermatologist' },
  { value: 'Neurologist', label: 'Neurologist' },
  { value: 'Psychiatrist', label: 'Psychiatrist' },
  { value: 'Oncologist', label: 'Oncologist' },
  { value: 'Gastroenterologist', label: 'Gastroenterologist' },
  { value: 'Pulmonologist', label: 'Pulmonologist / Chest Physician' },
  { value: 'Nephrologist', label: 'Nephrologist' },
  { value: 'Urologist', label: 'Urologist' },
  { value: 'General Surgeon', label: 'General Surgeon' },
  { value: 'ENT Specialist', label: 'ENT Specialist' },
  { value: 'Ophthalmologist', label: 'Ophthalmologist' },
  { value: 'Dentist', label: 'Dentist' },
  { value: 'Other', label: 'Other (Specify)' },
];

const STATE_OPTIONS = [
  { value: 'Andhra Pradesh', label: 'Andhra Pradesh' },
  { value: 'Telangana', label: 'Telangana' },
  { value: 'Karnataka', label: 'Karnataka' },
  { value: 'Tamil Nadu', label: 'Tamil Nadu' },
  { value: 'Maharashtra', label: 'Maharashtra' },
  { value: 'Delhi', label: 'Delhi' },
  { value: 'Kerala', label: 'Kerala' },
  { value: 'Gujarat', label: 'Gujarat' },
  { value: 'Rajasthan', label: 'Rajasthan' },
  { value: 'West Bengal', label: 'West Bengal' },
  { value: 'Uttar Pradesh', label: 'Uttar Pradesh' },
  { value: 'Madhya Pradesh', label: 'Madhya Pradesh' },
  { value: 'Other', label: 'Other' },
];

export default function DoctorRegister() {
  const navigate = useNavigate();
  const { user, setUserData } = useAuth();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Step 1: Profile State
  const [profileData, setProfileData] = useState({
    name: user?.displayName || '',
    specialty: '',
    customSpecialty: '',
    qualifications: '',
    regNumber: '',
    experience: '',
    city: 'Kurnool',
    state: 'Andhra Pradesh',
    mobile: '',
  });

  // Step 2: Clinic State
  const [clinicMode, setClinicMode] = useState('create'); // 'create' | 'existing'
  const [clinicData, setClinicData] = useState({
    clinicName: '',
    address: '',
    phone: '',
    slug: '',
    slugCustomized: false,
  });
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState(null); // true | false | null
  
  // Existing clinic lookup
  const [existingSlugInput, setExistingSlugInput] = useState('');
  const [existingClinicSearching, setExistingClinicSearching] = useState(false);
  const [verifiedExistingClinic, setVerifiedExistingClinic] = useState(null);
  const [existingClinicError, setExistingClinicError] = useState('');

  // Step 3: Rep Schedule State
  const [schedule, setSchedule] = useState(DEFAULT_REP_SCHEDULE);

  // Step 4: Privacy Settings State
  const [privacy, setPrivacy] = useState({
    visibleInSearch: true,
    showSpecialty: true,
    showCity: true,
    showClinicName: true,
    allowWhatsAppRedirect: true,
    rejectionReasonsEnabled: true,
  });

  // Step 5: Success State
  const [createdResult, setCreatedResult] = useState(null);

  // Update profile name when auth user loads
  useEffect(() => {
    if (user?.displayName && !profileData.name) {
      setProfileData(prev => ({ ...prev, name: user.displayName }));
    }
  }, [user]);

  // Auto-generate clinic slug when clinicName or city changes (unless user typed a custom slug)
  useEffect(() => {
    if (clinicMode === 'create' && !clinicData.slugCustomized && clinicData.clinicName) {
      const cityPart = profileData.city ? `-${profileData.city}` : '';
      const autoSlug = slugify(`${clinicData.clinicName}${cityPart}`);
      setClinicData(prev => ({ ...prev, slug: autoSlug }));
      checkClinicSlugAvailability(autoSlug);
    }
  }, [clinicData.clinicName, profileData.city, clinicMode, clinicData.slugCustomized]);

  const checkClinicSlugAvailability = async (slugToCheck) => {
    if (!slugToCheck || slugToCheck.length < 3) {
      setSlugAvailable(null);
      return;
    }
    setSlugChecking(true);
    try {
      const existing = await getClinicBySlug(slugToCheck);
      setSlugAvailable(!existing);
    } catch (err) {
      console.error('Error checking clinic slug:', err);
      setSlugAvailable(null);
    } finally {
      setSlugChecking(false);
    }
  };

  const handleLookupExistingClinic = async () => {
    const clean = slugify(existingSlugInput);
    if (!clean) return;
    setExistingClinicSearching(true);
    setExistingClinicError('');
    setVerifiedExistingClinic(null);

    try {
      const found = await getClinicBySlug(clean);
      if (found) {
        setVerifiedExistingClinic(found);
      } else {
        setExistingClinicError(`No active clinic found with slug "${clean}". Please check the spelling or create a new clinic.`);
      }
    } catch (err) {
      console.error('Error looking up clinic:', err);
      setExistingClinicError('Failed to lookup clinic. Please try again.');
    } finally {
      setExistingClinicSearching(false);
    }
  };

  const updateProfile = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const updateClinic = (field, value) => {
    setClinicData(prev => ({ ...prev, [field]: value }));
  };

  // Step validation helpers
  const isStep1Valid = () => {
    const hasName = Boolean(profileData.name.trim());
    const hasSpecialty = profileData.specialty === 'Other' 
      ? Boolean(profileData.customSpecialty.trim()) 
      : Boolean(profileData.specialty);
    const hasQuals = Boolean(profileData.qualifications.trim());
    const hasCity = Boolean(profileData.city.trim());
    const hasState = Boolean(profileData.state.trim());
    const hasValidPhone = profileData.mobile.replace(/\D/g, '').length === 10;
    return hasName && hasSpecialty && hasQuals && hasCity && hasState && hasValidPhone;
  };

  const isStep2Valid = () => {
    if (clinicMode === 'create') {
      return (
        Boolean(clinicData.clinicName.trim()) &&
        Boolean(clinicData.address.trim()) &&
        Boolean(clinicData.slug.trim()) &&
        slugAvailable === true
      );
    }
    if (clinicMode === 'existing') {
      return Boolean(verifiedExistingClinic);
    }
    return false;
  };

  const isStep3Valid = () => {
    if (!hasConfiguredHours(schedule.weekly)) return false;
    for (const day of Object.keys(schedule.weekly)) {
      const ranges = schedule.weekly[day];
      if (ranges && ranges.length > 0) {
        const check = validateDayRanges(ranges);
        if (check.hasError) return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && !isStep1Valid()) return;
    if (step === 2 && !isStep2Valid()) return;
    if (step === 3 && !isStep3Valid()) return;
    setStep(prev => prev + 1);
  };

  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const finalSpecialty = profileData.specialty === 'Other' 
        ? profileData.customSpecialty.trim() 
        : profileData.specialty;

      // 1. Create User Document (role: ['doctor'])
      const userDataPayload = {
        name: profileData.name.trim() || user.displayName || 'Doctor',
        email: (user.email || '').toLowerCase(),
        photoUrl: user.photoURL || '',
        mobile: profileData.mobile.replace(/\D/g, ''),
        role: ['doctor'],
        isActive: true,
      };
      await createUser(user.uid, userDataPayload);

      // 2. Setup Clinic
      let clinicId = '';
      let clinicSlug = '';
      let clinicName = '';

      if (clinicMode === 'create') {
        clinicSlug = slugify(clinicData.slug);
        clinicName = clinicData.clinicName.trim();
        clinicId = await createClinic({
          clinicName,
          address: clinicData.address.trim(),
          city: profileData.city.trim(),
          state: profileData.state.trim(),
          phone: clinicData.phone || profileData.mobile,
          slug: clinicSlug,
          ownerDoctorId: user.uid,
          qrCodeData: `${window.location.origin}/clinic/${clinicSlug}`,
          isActive: true
        });
      } else {
        clinicId = verifiedExistingClinic.id;
        clinicSlug = verifiedExistingClinic.slug;
        clinicName = verifiedExistingClinic.clinicName;
      }

      // 3. Link Doctor to Clinic
      await linkDoctorClinic(user.uid, clinicId);

      // 4. Store Private Doctor Contact (WhatsApp + Phone)
      const cleanMobile = profileData.mobile.replace(/\D/g, '');
      await setDoctorContact(user.uid, {
        whatsappNumber: cleanMobile,
        phone: cleanMobile
      });

      // 5. Generate and Claim Doctor Profile Slug
      let baseDrSlug = slugify(profileData.name.replace(/^dr\.?\s+/i, ''));
      if (!baseDrSlug) baseDrSlug = `doctor-${user.uid.slice(0, 5)}`;
      let drSlug = baseDrSlug;
      const isAvailable = await isSlugAvailable(drSlug, user.uid);
      if (!isAvailable) {
        drSlug = `${baseDrSlug}-${user.uid.slice(0, 4).toLowerCase()}`;
      }
      await setDoctorSlug(drSlug, user.uid);

      // 6. Create Doctor Document
      await createDoctor(user.uid, {
        uid: user.uid,
        name: profileData.name.trim(),
        photoUrl: user.photoURL || '',
        specialty: finalSpecialty,
        qualifications: profileData.qualifications.trim(),
        regNumber: profileData.regNumber.trim() || '',
        yearsExperience: Number(profileData.experience || 0),
        city: profileData.city.trim(),
        state: profileData.state.trim(),
        clinicIds: [clinicId],
        profileSlug: drSlug,
        privacy: {
          ...DEFAULT_DOCTOR_PRIVACY,
          ...privacy,
        },
        repSchedule: schedule,
        stats: {
          avgResponseMinutes: 0,
          decisionsCount: 0
        }
      });

      // Update auth context
      setUserData(userDataPayload);

      // Save created result for success screen
      setCreatedResult({
        doctorName: profileData.name.trim(),
        clinicId,
        clinicSlug,
        clinicName,
      });

      setStep(5); // Show success screen
    } catch (error) {
      console.error('Registration failed:', error);
      setSubmitError(error.message || 'Registration failed. Please check your details and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepsMeta = [
    { num: 1, label: 'Profile', icon: Stethoscope },
    { num: 2, label: 'Clinic', icon: Building2 },
    { num: 3, label: 'Rep Schedule', icon: Calendar },
    { num: 4, label: 'Privacy', icon: ShieldCheck },
  ];

  // -------------------------------------------------------------
  // SUCCESS SCREEN (Step 5)
  // -------------------------------------------------------------
  if (step === 5 && createdResult) {
    const formattedDrName = createdResult.doctorName.startsWith('Dr.') 
      ? createdResult.doctorName 
      : `Dr. ${createdResult.doctorName}`;
    const clinicQrUrl = `${window.location.origin}/clinic/${createdResult.clinicSlug}`;

    return (
      <div className="min-h-screen bg-cream-50 flex flex-col font-sans selection:bg-amber-100 selection:text-sand-600 p-4 sm:p-8">
        <div className="max-w-xl w-full mx-auto my-auto space-y-6">
          
          {/* Header Card */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-[1.25rem] bg-teal-50 border border-teal-600/20 text-teal-600 flex items-center justify-center mx-auto shadow-sm">
              <Check className="w-7 h-7 stroke-[2.5]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-ink">
              You're all set, {formattedDrName}!
            </h1>
            <p className="text-xs sm:text-sm text-ink-soft max-w-md mx-auto">
              Your Gatepass profile and rep visit schedule are live. Visiting medical reps can scan your reception poster to view your slots.
            </p>
          </div>

          {/* Boarding Pass / Poster Preview EdgeCard */}
          <EdgeCard edge="amber" className="p-6 bg-white space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <MonoTag variant="navy">Reception Desk Poster</MonoTag>
                <h3 className="font-display font-bold text-lg text-ink mt-2">
                  {createdResult.clinicName}
                </h3>
                <p className="text-xs text-ink-soft">
                  Scan to book a verified Gatepass with {formattedDrName}
                </p>
              </div>
              <div className="p-2 bg-cream-50 rounded-[0.875rem] border border-line flex-shrink-0">
                <QRCodeSVG
                  value={clinicQrUrl}
                  size={100}
                  level="M"
                  includeMargin={false}
                />
              </div>
            </div>

            <div className="p-3.5 bg-cream-50 rounded-[0.875rem] border border-line flex items-center justify-between text-xs">
              <div className="min-w-0 pr-3">
                <span className="font-mono text-[0.625rem] uppercase tracking-wider text-ink-mute block font-semibold">
                  Clinic Link
                </span>
                <span className="font-mono text-ink font-medium truncate block">
                  {clinicQrUrl}
                </span>
              </div>
              <MonoTag variant="teal">Active</MonoTag>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => window.open(`/print/clinic/${createdResult.clinicId}`, '_blank')}
                className="flex-1 py-3 px-4 bg-navy-900 hover:bg-navy-700 text-white rounded-[0.875rem] font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.99]"
              >
                <Printer className="w-4 h-4 text-amber-500" />
                Print Poster (A4)
              </button>

              <button
                onClick={() => navigate('/admin')}
                className="flex-1 py-3 px-4 bg-white border border-line hover:border-navy-500 text-ink rounded-[0.875rem] font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.99]"
              >
                Open My Dashboard
                <ArrowRight className="w-4 h-4 text-ink-soft" />
              </button>
            </div>
          </EdgeCard>

        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // WIZARD LAYOUT (Steps 1–4)
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-cream-50 flex flex-col font-sans selection:bg-amber-100 selection:text-sand-600">
      
      {/* Top Header & Progress Stepper */}
      <div className="bg-white/95 backdrop-blur-md border-b border-line px-4 sm:px-8 py-4 sticky top-0 z-20 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[0.875rem] bg-navy-900 text-white flex items-center justify-center shadow-sm">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-display font-bold text-base sm:text-lg text-ink leading-tight">
                Doctor Onboarding
              </h1>
              <p className="font-mono text-[0.625rem] uppercase tracking-wider text-sand-600 font-semibold">
                Step {step} of 4: {stepsMeta[step - 1]?.label}
              </p>
            </div>
          </div>

          {/* Stepper Dots / Badges */}
          <div className="hidden sm:flex items-center gap-2">
            {stepsMeta.map((s, idx) => {
              const Icon = s.icon;
              const isPast = step > s.num;
              const isCurrent = step === s.num;
              return (
                <div key={s.num} className="flex items-center">
                  <div
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-[0.75rem] text-xs font-semibold transition-all",
                      isCurrent && "bg-navy-900 text-white shadow-sm",
                      isPast && "bg-teal-50 text-teal-600 border border-teal-600/20",
                      !isCurrent && !isPast && "bg-cream-50 text-ink-mute border border-line"
                    )}
                  >
                    {isPast ? (
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    ) : (
                      <Icon className="w-3.5 h-3.5" />
                    )}
                    <span>{s.label}</span>
                  </div>
                  {idx < stepsMeta.length - 1 && (
                    <div className={cn("w-4 h-0.5 mx-1", isPast ? "bg-teal-600/30" : "bg-line")} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile progress bar */}
        <div className="sm:hidden mt-3 h-1 bg-cream-50 rounded-full overflow-hidden border border-line">
          <div 
            className="h-full bg-navy-900 transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* Wizard Body */}
      <div className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-8 flex flex-col justify-between">
        <div className="space-y-6">

          {/* ========================================================= */}
          {/* STEP 1: PROFILE */}
          {/* ========================================================= */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-display font-bold text-ink tracking-tight">
                  Professional Identity
                </h2>
                <p className="text-xs sm:text-sm text-ink-soft mt-1">
                  Tell visiting medical representatives about your practice and qualifications.
                </p>
              </div>

              <EdgeCard edge="navy" className="p-5 sm:p-6 bg-white space-y-5">
                
                {/* Doctor Name */}
                <div className="space-y-1.5">
                  <label className="font-mono text-[0.6875rem] uppercase tracking-wider text-ink-mute font-semibold">
                    Doctor Full Name <span className="text-coral-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => updateProfile('name', e.target.value)}
                    placeholder="e.g. Dr. T. Karthik"
                    className="w-full bg-cream-50 border border-line rounded-[0.875rem] px-4 py-3 text-sm font-medium text-ink outline-none focus:border-navy-500 transition-all"
                  />
                </div>

                {/* Specialty Dropdown */}
                <div className="space-y-1.5">
                  <label className="font-mono text-[0.6875rem] uppercase tracking-wider text-ink-mute font-semibold">
                    Primary Specialty <span className="text-coral-600">*</span>
                  </label>
                  <SearchableSelect
                    options={SPECIALTY_OPTIONS}
                    value={profileData.specialty}
                    onChange={(val) => updateProfile('specialty', val)}
                    placeholder="Select medical specialty"
                  />
                  {profileData.specialty === 'Other' && (
                    <input
                      type="text"
                      value={profileData.customSpecialty}
                      onChange={(e) => updateProfile('customSpecialty', e.target.value)}
                      placeholder="Specify your specialty"
                      className="mt-2 w-full bg-cream-50 border border-line rounded-[0.875rem] px-4 py-3 text-sm font-medium text-ink outline-none focus:border-navy-500 transition-all"
                    />
                  )}
                </div>

                {/* Qualifications */}
                <div className="space-y-1.5">
                  <label className="font-mono text-[0.6875rem] uppercase tracking-wider text-ink-mute font-semibold">
                    Degrees & Qualifications <span className="text-coral-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={profileData.qualifications}
                    onChange={(e) => updateProfile('qualifications', e.target.value)}
                    placeholder="e.g. MBBS, MD (General Medicine), DNB"
                    className="w-full bg-cream-50 border border-line rounded-[0.875rem] px-4 py-3 text-sm font-medium text-ink outline-none focus:border-navy-500 transition-all"
                  />
                </div>

                {/* Reg Number & Experience */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-mono text-[0.6875rem] uppercase tracking-wider text-ink-mute font-semibold flex justify-between">
                      <span>Medical Reg. No.</span>
                      <span className="text-ink-mute/70">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={profileData.regNumber}
                      onChange={(e) => updateProfile('regNumber', e.target.value)}
                      placeholder="e.g. APMC-48192"
                      className="w-full bg-cream-50 border border-line rounded-[0.875rem] px-4 py-3 text-sm font-medium text-ink outline-none focus:border-navy-500 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-mono text-[0.6875rem] uppercase tracking-wider text-ink-mute font-semibold">
                      Years of Experience
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="70"
                      value={profileData.experience}
                      onChange={(e) => updateProfile('experience', e.target.value)}
                      placeholder="e.g. 12"
                      className="w-full bg-cream-50 border border-line rounded-[0.875rem] px-4 py-3 text-sm font-medium text-ink outline-none focus:border-navy-500 transition-all"
                    />
                  </div>
                </div>

                {/* City & State */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-mono text-[0.6875rem] uppercase tracking-wider text-ink-mute font-semibold">
                      Practice City <span className="text-coral-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={profileData.city}
                      onChange={(e) => updateProfile('city', e.target.value)}
                      placeholder="e.g. Kurnool"
                      className="w-full bg-cream-50 border border-line rounded-[0.875rem] px-4 py-3 text-sm font-medium text-ink outline-none focus:border-navy-500 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-mono text-[0.6875rem] uppercase tracking-wider text-ink-mute font-semibold">
                      State <span className="text-coral-600">*</span>
                    </label>
                    <SearchableSelect
                      options={STATE_OPTIONS}
                      value={profileData.state}
                      onChange={(val) => updateProfile('state', val)}
                      placeholder="Select state"
                    />
                  </div>
                </div>

                {/* WhatsApp Phone */}
                <div className="space-y-1.5">
                  <label className="font-mono text-[0.6875rem] uppercase tracking-wider text-ink-mute font-semibold flex justify-between">
                    <span>Doctor WhatsApp Number <span className="text-coral-600">*</span></span>
                    <span className="text-teal-600 font-mono text-[0.625rem]">Private & Encrypted</span>
                  </label>
                  <PhoneInput
                    value={profileData.mobile}
                    onChange={(val) => updateProfile('mobile', val)}
                    required
                  />
                  <p className="text-[0.6875rem] text-ink-mute">
                    Used exclusively for private WhatsApp communication with approved reps. Never shown publicly.
                  </p>
                </div>

              </EdgeCard>
            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 2: CLINIC */}
          {/* ========================================================= */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-display font-bold text-ink tracking-tight">
                  Clinic & Reception
                </h2>
                <p className="text-xs sm:text-sm text-ink-soft mt-1">
                  Connect where you meet reps, so your reception desk can display your Gatepass QR poster.
                </p>
              </div>

              {/* Mode Selector Tabs */}
              <div className="grid grid-cols-2 gap-3 p-1 bg-cream-50 border border-line rounded-[1rem]">
                <button
                  type="button"
                  onClick={() => setClinicMode('create')}
                  className={cn(
                    "py-3 px-4 rounded-[0.75rem] font-bold text-xs transition-all flex items-center justify-center gap-2",
                    clinicMode === 'create'
                      ? "bg-white text-navy-900 shadow-sm border border-line"
                      : "text-ink-mute hover:text-ink"
                  )}
                >
                  <Building2 className="w-4 h-4" />
                  Create My Clinic
                </button>
                <button
                  type="button"
                  onClick={() => setClinicMode('existing')}
                  className={cn(
                    "py-3 px-4 rounded-[0.75rem] font-bold text-xs transition-all flex items-center justify-center gap-2",
                    clinicMode === 'existing'
                      ? "bg-white text-navy-900 shadow-sm border border-line"
                      : "text-ink-mute hover:text-ink"
                  )}
                >
                  <Search className="w-4 h-4" />
                  Existing Clinic
                </button>
              </div>

              {/* OPTION A: Create My Clinic */}
              {clinicMode === 'create' && (
                <EdgeCard edge="navy" className="p-5 sm:p-6 bg-white space-y-5">
                  <div className="space-y-1.5">
                    <label className="font-mono text-[0.6875rem] uppercase tracking-wider text-ink-mute font-semibold">
                      Clinic / Hospital Name <span className="text-coral-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={clinicData.clinicName}
                      onChange={(e) => updateClinic('clinicName', e.target.value)}
                      placeholder="e.g. Remedi Clinic"
                      className="w-full bg-cream-50 border border-line rounded-[0.875rem] px-4 py-3 text-sm font-medium text-ink outline-none focus:border-navy-500 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-mono text-[0.6875rem] uppercase tracking-wider text-ink-mute font-semibold">
                      Full Address <span className="text-coral-600">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={clinicData.address}
                      onChange={(e) => updateClinic('address', e.target.value)}
                      placeholder="Street address, landmark, area"
                      className="w-full bg-cream-50 border border-line rounded-[0.875rem] px-4 py-3 text-sm font-medium text-ink outline-none focus:border-navy-500 transition-all resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-mono text-[0.6875rem] uppercase tracking-wider text-ink-mute font-semibold">
                        Clinic City
                      </label>
                      <input
                        type="text"
                        disabled
                        value={profileData.city}
                        className="w-full bg-cream-50/60 border border-line rounded-[0.875rem] px-4 py-3 text-sm font-medium text-ink-soft cursor-not-allowed"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-mono text-[0.6875rem] uppercase tracking-wider text-ink-mute font-semibold flex justify-between">
                        <span>Clinic Phone</span>
                        <span className="text-ink-mute/70">(Optional)</span>
                      </label>
                      <input
                        type="tel"
                        value={clinicData.phone}
                        onChange={(e) => updateClinic('phone', e.target.value)}
                        placeholder="e.g. 08518-223344"
                        className="w-full bg-cream-50 border border-line rounded-[0.875rem] px-4 py-3 text-sm font-medium text-ink outline-none focus:border-navy-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Clinic Slug Field with Live Uniqueness Check */}
                  <div className="space-y-1.5 pt-2 border-t border-line">
                    <label className="font-mono text-[0.6875rem] uppercase tracking-wider text-ink-mute font-semibold flex items-center justify-between">
                      <span>Unique Clinic Slug <span className="text-coral-600">*</span></span>
                      {slugChecking && <span className="text-sand-600 font-sans text-xs">Checking availability...</span>}
                      {!slugChecking && slugAvailable === true && (
                        <span className="text-teal-600 font-sans text-xs flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Slug Available
                        </span>
                      )}
                      {!slugChecking && slugAvailable === false && (
                        <span className="text-coral-600 font-sans text-xs flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> Already taken
                        </span>
                      )}
                    </label>

                    <div className="flex items-center w-full bg-cream-50 border border-line rounded-[0.875rem] overflow-hidden focus-within:border-navy-500 transition-all">
                      <span className="bg-white/80 border-r border-line px-3 py-3 font-mono text-xs text-ink-mute select-none hidden sm:inline">
                        gatepass.in/clinic/
                      </span>
                      <input
                        type="text"
                        value={clinicData.slug}
                        onChange={(e) => {
                          const clean = slugify(e.target.value);
                          setClinicData(prev => ({ ...prev, slug: clean, slugCustomized: true }));
                          checkClinicSlugAvailability(clean);
                        }}
                        onBlur={() => checkClinicSlugAvailability(clinicData.slug)}
                        placeholder="remedi-clinic-kurnool"
                        className="flex-1 bg-transparent px-3.5 py-3 font-mono text-xs text-ink outline-none"
                      />
                    </div>
                    <p className="text-[0.6875rem] text-ink-mute">
                      Used for your reception QR poster URL: <span className="font-mono text-ink font-medium">/clinic/{clinicData.slug || 'your-clinic'}</span>
                    </p>
                  </div>

                </EdgeCard>
              )}

              {/* OPTION B: Existing Clinic Lookup */}
              {clinicMode === 'existing' && (
                <EdgeCard edge="navy" className="p-5 sm:p-6 bg-white space-y-5">
                  <div className="space-y-1.5">
                    <label className="font-mono text-[0.6875rem] uppercase tracking-wider text-ink-mute font-semibold">
                      Enter Existing Clinic Slug
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={existingSlugInput}
                        onChange={(e) => setExistingSlugInput(e.target.value)}
                        placeholder="e.g. remedi-clinic-kurnool"
                        className="flex-1 bg-cream-50 border border-line rounded-[0.875rem] px-4 py-3 font-mono text-xs text-ink outline-none focus:border-navy-500 transition-all"
                      />
                      <button
                        type="button"
                        onClick={handleLookupExistingClinic}
                        disabled={existingClinicSearching || !existingSlugInput.trim()}
                        className="px-5 py-3 bg-navy-900 hover:bg-navy-700 text-white rounded-[0.875rem] text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {existingClinicSearching ? 'Searching...' : 'Find Clinic'}
                      </button>
                    </div>
                  </div>

                  {existingClinicError && (
                    <div className="p-3 bg-coral-50 border border-coral-600/20 text-coral-600 rounded-[0.875rem] text-xs font-medium flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{existingClinicError}</span>
                    </div>
                  )}

                  {verifiedExistingClinic && (
                    <div className="p-4 bg-teal-50 border border-teal-600/20 rounded-[1rem] space-y-2">
                      <div className="flex items-center justify-between">
                        <MonoTag variant="teal">Clinic Verified</MonoTag>
                        <span className="font-mono text-[0.6875rem] text-teal-600 font-semibold">
                          slug: {verifiedExistingClinic.slug}
                        </span>
                      </div>
                      <h4 className="font-display font-bold text-base text-ink">
                        {verifiedExistingClinic.clinicName}
                      </h4>
                      <p className="text-xs text-ink-soft">
                        {verifiedExistingClinic.address}, {verifiedExistingClinic.city}, {verifiedExistingClinic.state}
                      </p>
                    </div>
                  )}
                </EdgeCard>
              )}

            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 3: REP SCHEDULE */}
          {/* ========================================================= */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-display font-bold text-ink tracking-tight">
                  Rep Visit Schedule
                </h2>
                <p className="text-xs sm:text-sm text-ink-soft mt-1">
                  The core differentiator of Gatepass: define strict consultation hours and daily quotas for medical reps.
                </p>
              </div>

              <EdgeCard edge="amber" className="p-5 sm:p-6 bg-white space-y-6">
                <RepScheduleEditor
                  schedule={schedule}
                  onChange={setSchedule}
                />
              </EdgeCard>
            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 4: PRIVACY & FINISH */}
          {/* ========================================================= */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-display font-bold text-ink tracking-tight">
                  Privacy & Preferences
                </h2>
                <p className="text-xs sm:text-sm text-ink-soft mt-1">
                  Tune your discoverability and communication settings. You can modify these anytime.
                </p>
              </div>

              <EdgeCard edge="navy" className="p-5 sm:p-6 bg-white space-y-4 divide-y divide-line">
                
                <div className="pt-0">
                  <ToggleSwitch
                    label="Visible in Search Directory"
                    description="Allow medical representatives to find you in the Gatepass doctor directory"
                    checked={privacy.visibleInSearch}
                    onChange={(v) => setPrivacy(p => ({ ...p, visibleInSearch: v }))}
                  />
                </div>

                <div className="pt-4">
                  <ToggleSwitch
                    label="Show Medical Specialty"
                    description="Display your specialty on your public Gatepass profile card"
                    checked={privacy.showSpecialty}
                    onChange={(v) => setPrivacy(p => ({ ...p, showSpecialty: v }))}
                  />
                </div>

                <div className="pt-4">
                  <ToggleSwitch
                    label="Show Practice City"
                    description="Display Kurnool (or your practice city) in doctor listings"
                    checked={privacy.showCity}
                    onChange={(v) => setPrivacy(p => ({ ...p, showCity: v }))}
                  />
                </div>

                <div className="pt-4">
                  <ToggleSwitch
                    label="Show Clinic Affiliation"
                    description="Show clinic name on the live Gatepass shown at reception"
                    checked={privacy.showClinicName}
                    onChange={(v) => setPrivacy(p => ({ ...p, showClinicName: v }))}
                  />
                </div>

                <div className="pt-4">
                  <ToggleSwitch
                    label="Allow WhatsApp Direct Contact"
                    description="Provide a quick WhatsApp button for approved reps to notify you of arrival"
                    checked={privacy.allowWhatsAppRedirect}
                    onChange={(v) => setPrivacy(p => ({ ...p, allowWhatsAppRedirect: v }))}
                  />
                </div>

                <div className="pt-4">
                  <ToggleSwitch
                    label="Constructive Rejection Reasons"
                    description="Optionally share a quick reason (e.g. Schedule Full, Out of Town) when declining a slot"
                    checked={privacy.rejectionReasonsEnabled}
                    onChange={(v) => setPrivacy(p => ({ ...p, rejectionReasonsEnabled: v }))}
                  />
                </div>

              </EdgeCard>

              {submitError && (
                <div className="p-4 bg-coral-50 border border-coral-600/20 text-coral-600 rounded-[1rem] text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Wizard Bottom Navigation Buttons */}
        <div className="mt-8 pt-4 border-t border-line flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(prev => prev - 1)}
              className="py-3 px-5 rounded-[0.875rem] border border-line bg-white hover:bg-cream-50 text-ink font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
          ) : <div />}

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={
                (step === 1 && !isStep1Valid()) ||
                (step === 2 && !isStep2Valid()) ||
                (step === 3 && !isStep3Valid())
              }
              className="py-3 px-6 rounded-[0.875rem] bg-navy-900 hover:bg-navy-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-40"
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="py-3 px-7 rounded-[0.875rem] bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-sm active:scale-[0.99] disabled:opacity-50"
            >
              {isSubmitting ? (
                <>Saving Profile...</>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Complete Registration
                </>
              )}
            </button>
          )}
        </div>

      </div>

    </div>
  );
}
