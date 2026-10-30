/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUser } from '../../lib/db/users';
import { createRep, getRep } from '../../lib/db/reps';
import { useAuth } from '../../lib/auth';
import { handleFirestoreError, OperationType } from '../../utils/firebaseErrors';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { PhoneInput } from '../../components/ui/PhoneInput';
import { ToggleSwitch } from '../../components/ui/ToggleSwitch';
import { ChevronRight, ChevronLeft, Briefcase, Pill, Building2, Check, AlertCircle } from 'lucide-react';
import SpecialtySelector from '../../components/rep/SpecialtySelector';
import ProductListManager from '../../components/rep/ProductListManager';
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

export default function RepRegister() {
  const navigate = useNavigate();
  const { user, userData, setUserData } = useAuth();
  
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({
    mobile: '',
    companyName: '',
    division: '',
    designation: '',
    specialties: [],
    subSpecialties: [],
    therapeuticCategory: '',
    therapeuticCategory2: '',
    products: [],
    productNames: [],
    molecules: '',
    dosageForms: [],
    samplesAvailable: true,
    companyOffice: '',
    medInfoHelpline: '',
  });

  // Check if rep is already registered; if so, redirect directly to /rep/home!
  useEffect(() => {
    if (!user) return;
    async function checkExisting() {
      try {
        const existingRep = await getRep(user.uid);
        if (existingRep && userData?.role?.includes('rep')) {
          sessionStorage.removeItem('pendingRole');
          navigate('/rep/home', { replace: true });
          return;
        }

        if (existingRep) {
          const initialSpecialties = Array.isArray(existingRep.specialties) && existingRep.specialties.length > 0
            ? existingRep.specialties
            : [existingRep.therapeuticCategory, existingRep.therapeuticCategory2].filter(Boolean);

          const initialProducts = Array.isArray(existingRep.products) && existingRep.products.length > 0
            ? existingRep.products
            : (Array.isArray(existingRep.productNames) ? existingRep.productNames.map(p => ({
                id: Math.random().toString(36).substring(2, 9),
                name: typeof p === 'string' ? p : p.name,
                molecule: typeof p === 'object' ? p.molecule : (existingRep.molecules || ''),
                dosageForm: typeof p === 'object' ? p.dosageForm : (existingRep.dosageForms?.[0] || 'Tablet')
              })) : []);

          setFormData(prev => ({
            ...prev,
            mobile: userData?.mobile || prev.mobile,
            companyName: existingRep.companyName || prev.companyName,
            division: existingRep.division || prev.division,
            designation: existingRep.designation || prev.designation,
            specialties: initialSpecialties,
            subSpecialties: Array.isArray(existingRep.subSpecialties) ? existingRep.subSpecialties : [],
            therapeuticCategory: existingRep.therapeuticCategory || prev.therapeuticCategory,
            therapeuticCategory2: existingRep.therapeuticCategory2 || prev.therapeuticCategory2,
            products: initialProducts,
            productNames: Array.isArray(existingRep.productNames) ? existingRep.productNames : initialProducts.map(p => p.name),
            molecules: existingRep.molecules || prev.molecules,
            dosageForms: existingRep.dosageForms || prev.dosageForms,
            samplesAvailable: existingRep.samplesAvailable !== undefined ? existingRep.samplesAvailable : prev.samplesAvailable,
            companyOffice: existingRep.companyOffice || prev.companyOffice,
            medInfoHelpline: existingRep.medInfoHelpline || prev.medInfoHelpline,
          }));
        } else if (userData?.mobile) {
          setFormData(prev => ({ ...prev, mobile: userData.mobile }));
        }
      } catch (err) {
        console.error('Error checking existing rep:', err);
      }
    }
    checkExisting();
  }, [user, userData, navigate]);

  const updateForm = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.companyName || !formData.designation || formData.mobile.length < 10) return;
    }
    if (step === 2) {
      const hasSpecialties = (formData.specialties && formData.specialties.length > 0) || formData.therapeuticCategory;
      const hasProducts = (formData.products && formData.products.length > 0) || (formData.productNames && formData.productNames.length > 0);
      if (!hasSpecialties || !hasProducts) return;
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => setStep(prev => prev - 1);

  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      const cleanMobile = (formData.mobile || '').replace(/\D/g, '');
      const userDataPayload = {
        name: user.displayName || 'Rep',
        email: user.email || '',
        photoUrl: user.photoURL || '',
        mobile: cleanMobile,
        role: ['rep'],
        isActive: true,
      };
      await createUser(user.uid, userDataPayload);

      const primaryCategory = Array.isArray(formData.specialties) && formData.specialties.length > 0
        ? formData.specialties[0]
        : (formData.therapeuticCategory || 'General Medicine');
      const secondaryCategory = Array.isArray(formData.specialties) && formData.specialties.length > 1
        ? formData.specialties[1]
        : (formData.therapeuticCategory2 || '');

      const productNamesList = (formData.products && formData.products.length > 0)
        ? formData.products.map(p => p.name).filter(Boolean)
        : (formData.productNames || []);

      const repData = {
        uid: user.uid,
        companyName: formData.companyName,
        companyHistory: [],
        division: formData.division,
        designation: formData.designation,
        specialties: formData.specialties || [primaryCategory],
        subSpecialties: formData.subSpecialties || [],
        therapeuticCategory: primaryCategory,
        therapeuticCategory2: secondaryCategory,
        products: formData.products || [],
        productNames: productNamesList,
        molecules: formData.molecules || '',
        dosageForms: formData.dosageForms || [],
        samplesAvailable: formData.samplesAvailable,
        companyOffice: formData.companyOffice || '',
        medInfoHelpline: formData.medInfoHelpline || '',
      };
      await createRep(user.uid, repData);
      
      setUserData(userDataPayload);
      sessionStorage.removeItem('pendingRole');
      navigate('/rep/home');
      
    } catch (error) {
      console.error('Registration error:', error);
      setSubmitError(error.message || 'Failed to complete registration. Please try again.');
    } finally {
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
      </div>

      <div className="flex-1 max-w-md w-full mx-auto p-5 sm:p-6 flex flex-col justify-between">
        
        {step === 1 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
            <div>
              <h2 className="text-2xl font-display font-bold text-ink tracking-tight">Organization</h2>
              <p className="text-ink-soft text-sm mt-1">Tell us which company you represent.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="font-mono text-xs uppercase tracking-wider text-ink-mute font-semibold px-0.5">
                  Company Name <span className="text-coral-600">*</span>
                </label>
                <input 
                  type="text" 
                  className="w-full border border-line rounded-[0.875rem] px-4 py-3 focus:ring-2 focus:ring-navy-100 focus:border-navy-500 bg-white shadow-sm outline-none font-medium text-ink placeholder:text-ink-mute text-sm transition-all"
                  placeholder="e.g. Sun Pharma, Torrent, Cipla"
                  value={formData.companyName}
                  onChange={(e) => updateForm('companyName', e.target.value)}
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-xs uppercase tracking-wider text-ink-mute font-semibold px-0.5">
                  Division <span className="text-ink-mute font-normal">(Optional)</span>
                </label>
                <input 
                  type="text" 
                  className="w-full border border-line rounded-[0.875rem] px-4 py-3 focus:ring-2 focus:ring-navy-100 focus:border-navy-500 bg-white shadow-sm outline-none font-medium text-ink placeholder:text-ink-mute text-sm transition-all"
                  placeholder="e.g. Cardio-Diab, Spectra, Core"
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
              <h2 className="text-2xl font-display font-bold text-ink tracking-tight">Specialties & Portfolio</h2>
              <p className="text-ink-soft text-sm mt-1">Select your targeted medical specialties and products.</p>
            </div>

            <div className="space-y-5">
              <div className="p-4 bg-white rounded-[1.25rem] border border-line shadow-xs">
                <SpecialtySelector 
                  specialties={formData.specialties || []}
                  subSpecialties={formData.subSpecialties || []}
                  onChange={({ specialties, subSpecialties }) => {
                    setFormData(prev => ({
                      ...prev,
                      specialties,
                      subSpecialties,
                      therapeuticCategory: specialties[0] || '',
                      therapeuticCategory2: specialties[1] || ''
                    }));
                  }}
                />
              </div>

              <div className="p-4 bg-white rounded-[1.25rem] border border-line shadow-xs">
                <ProductListManager
                  products={formData.products || []}
                  productNames={formData.productNames || []}
                  onChange={({ products, productNames }) => {
                    setFormData(prev => ({
                      ...prev,
                      products,
                      productNames
                    }));
                  }}
                />
              </div>

              <div className="bg-white rounded-[1rem] shadow-sm border border-line px-4 py-3">
                <ToggleSwitch 
                  label="Samples Available"
                  description="I carry physician starter samples or leave-behinds on visits."
                  checked={formData.samplesAvailable}
                  onChange={(val) => updateForm('samplesAvailable', val)}
                />
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
                  {(formData.specialties || []).slice(0, 3).map((spec) => (
                    <MonoTag key={spec} variant="neutral">
                      {spec}
                    </MonoTag>
                  ))}
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

        {submitError && (
          <div className="mt-4 p-4 rounded-[1rem] bg-coral-50 border border-coral-600/30 text-coral-600 text-xs font-medium flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-8 pt-6 pb-4 flex gap-3">
          {step > 1 && (
            <button
              onClick={handleBack}
              className="flex-shrink-0 bg-white text-ink border border-line font-bold rounded-[0.875rem] w-12 h-12 hover:bg-cream-50 transition-all active:scale-95 flex items-center justify-center shadow-sm cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          
          {step < 3 ? (
            <button
              onClick={handleNext}
              disabled={
                (step === 1 && (!formData.companyName || !formData.designation || formData.mobile.length < 10)) ||
                (step === 2 && ((!formData.specialties || formData.specialties.length === 0) && !formData.therapeuticCategory))
              }
              className="flex-1 bg-navy-900 text-white font-bold rounded-[0.875rem] px-5 py-3 hover:bg-navy-700 transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-40 shadow-sm text-sm cursor-pointer"
            >
              Continue <ChevronRight className="w-4 h-4 text-amber-500" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 bg-navy-900 text-white font-bold rounded-[0.875rem] px-5 py-3 transition-all active:scale-[0.99] hover:bg-navy-700 flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm text-sm cursor-pointer"
            >
              {isSubmitting ? 'Saving...' : 'Complete Profile'} <Check className="w-4 h-4 text-teal-50" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
