import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Briefcase } from 'lucide-react';
import { loginWithGoogle } from '../lib/firebase';
import { useAuth } from '../lib/auth';
import RoleChooser from '../components/auth/RoleChooser';
import Perforation from '../components/ui/Perforation';
import MonoTag from '../components/ui/MonoTag';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, userData, loading } = useAuth();
  const [selectedRole, setSelectedRole] = useState(null); // 'doctor' | 'rep'
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    if (!loading && user && userData) {
      if (userData.role?.includes('doctor')) {
        navigate('/admin', { replace: true });
      } else if (userData.role?.includes('rep')) {
        navigate('/rep/home', { replace: true });
      }
    }
  }, [user, userData, loading, navigate]);

  // If user is authenticated with Google but has no users/{uid} document, show RoleChooser
  if (!loading && user && !userData) {
    return <RoleChooser />;
  }

  const handleGoogleSignIn = async (roleChoice = null) => {
    setAuthError('');
    setIsSigningIn(true);
    try {
      if (roleChoice) {
        sessionStorage.setItem('pendingRole', roleChoice);
      }
      await loginWithGoogle();
    } catch (error) {
      if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
        console.error('Sign-in error:', error);
        setAuthError('Sign-in failed. Please try again with Google.');
      }
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 text-ink flex flex-col font-sans selection:bg-amber-100 selection:text-sand-600">
      
      {/* ── Top Full-bleed Navy Hero ───────────────────────────────────── */}
      <section className="bg-navy-900 text-cream-50 pt-8 pb-12 px-4 sm:px-8 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-[-20%] left-[-10%] w-1/2 h-1/2 rounded-full bg-teal-600/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-1/2 h-1/2 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto">
          {/* Header Bar */}
          <div className="flex items-center justify-between mb-10">
            {/* Wordmark (Sora 700) with small amber notch icon */}
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-2xl tracking-tight text-white">
                Gatepass
              </span>
              <span className="w-2.5 h-2.5 rounded-[0.25rem] bg-amber-500 transform rotate-45 inline-block" />
            </div>

            <MonoTag variant="neutral" className="bg-white/10 text-cream-50 border-white/20">
              Beta · Kurnool
            </MonoTag>
          </div>

          {/* Hero Content */}
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-600/20 border border-teal-600/30 text-teal-50 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-600 motion-safe:animate-pulse" />
              Remedi Clinic Beta Access
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold tracking-tight text-white leading-[1.08]">
              Walk in. <br />
              <span className="text-amber-500">Don't wait.</span>
            </h1>

            <p className="text-base sm:text-lg text-navy-100 leading-relaxed max-w-xl font-normal pt-1">
              Book a confirmed slot with doctors. Show your Gatepass at reception.
            </p>
          </div>
        </div>

        {/* Perforated bottom edge */}
        <div className="absolute bottom-0 left-0 right-0">
          <Perforation bgClass="bg-cream-50" className="my-0" />
        </div>
      </section>

      {/* ── Main Action Section (Boarding Pass Stub Selector) ─────────── */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-8 -mt-5 z-10 pb-16">
        <div className="bg-white rounded-[1.75rem] border border-line shadow-[0_8px_24px_rgba(11,23,48,0.06)] p-6 sm:p-10">
          
          <div className="mb-6">
            <h2 className="text-xl font-display font-bold text-ink">
              Choose Your Portal
            </h2>
            <p className="text-sm text-ink-soft mt-0.5">
              Select your role to continue with Google
            </p>
          </div>

          {authError && (
            <div className="mb-6 p-4 rounded-[0.875rem] bg-coral-50 border border-coral-600/30 text-coral-600 text-xs font-semibold">
              {authError}
            </div>
          )}

          {/* Two Boarding-Pass-Stub Role Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            
            {/* Rep Stub */}
            <div
              onClick={() => setSelectedRole('rep')}
              className={`p-5 rounded-[1.25rem] border-2 cursor-pointer transition-all relative ${
                selectedRole === 'rep'
                  ? 'border-navy-900 border-l-[0.3125rem] border-l-amber-500 bg-cream-50 shadow-sm'
                  : 'border-line border-l-[0.3125rem] border-l-line hover:border-ink-mute bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-[0.875rem] bg-navy-100 text-navy-900 flex items-center justify-center font-bold">
                  <Briefcase className="w-5 h-5" />
                </div>
                <MonoTag variant="neutral">MR PASS</MonoTag>
              </div>
              <h3 className="font-display font-bold text-lg text-ink">Pharma Representative</h3>
              <p className="text-xs text-ink-soft mt-1 leading-snug">
                Book verified consultation slots, get live tokens, and avoid clinic waiting rooms.
              </p>
            </div>

            {/* Doctor Stub */}
            <div
              onClick={() => setSelectedRole('doctor')}
              className={`p-5 rounded-[1.25rem] border-2 cursor-pointer transition-all relative ${
                selectedRole === 'doctor'
                  ? 'border-navy-900 border-l-[0.3125rem] border-l-amber-500 bg-cream-50 shadow-sm'
                  : 'border-line border-l-[0.3125rem] border-l-line hover:border-ink-mute bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-[0.875rem] bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                  <Activity className="w-5 h-5" />
                </div>
                <MonoTag variant="amber">Invite Only</MonoTag>
              </div>
              <h3 className="font-display font-bold text-lg text-ink">Doctor</h3>
              <p className="text-xs text-ink-soft mt-1 leading-snug">
                Publish exact visit hours, approve vetted representatives, and protect patient care.
              </p>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="space-y-4">
            <button
              onClick={() => handleGoogleSignIn(selectedRole)}
              disabled={isSigningIn}
              className="w-full flex items-center justify-center gap-3 bg-navy-900 hover:bg-navy-700 text-white font-bold rounded-[0.875rem] px-6 py-4 transition-all shadow-md active:scale-[0.99] disabled:opacity-70 text-sm"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="var(--color-google-blue)"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="var(--color-google-green)"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="var(--color-google-yellow)"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="var(--color-google-red)"/>
              </svg>
              {isSigningIn ? 'Connecting with Google...' : 'Continue with Google'}
            </button>

            <p className="text-center text-xs text-ink-mute">
              Doctors: invite-only during beta.
            </p>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-line py-6 px-4 text-center text-xs text-ink-mute">
        <p>Gatepass · Remedi Clinic, Kurnool, Andhra Pradesh · Zero Wait Detailing Protocol</p>
      </footer>
    </div>
  );
}
