/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Activity, Briefcase, ShieldCheck, Clock, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { loginWithGoogle } from '../lib/firebase';
import { useAuth } from '../lib/auth';
import RoleChooser from '../components/auth/RoleChooser';
import Perforation from '../components/ui/Perforation';
import MonoTag from '../components/ui/MonoTag';
import LiveDot from '../components/ui/LiveDot';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, userData, loading, isPlatformAdmin } = useAuth();
  const [selectedRole, setSelectedRole] = useState('rep'); // Default to 'rep' for seamless 1-tap UX
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState('');

  const location = useLocation();

  useEffect(() => {
    if (!loading && user) {
      if (user.email?.toLowerCase() === 'onemediapp@gmail.com' || isPlatformAdmin) {
        navigate('/platform-admin', { replace: true });
        return;
      }
      if (userData) {
        sessionStorage.removeItem('pendingRole');
        const searchParams = new URLSearchParams(window.location.search);
        const redirectUrl = searchParams.get('redirect') || location.state?.from?.pathname;
        if (redirectUrl && redirectUrl !== '/') {
          navigate(redirectUrl, { replace: true });
          return;
        }
        if (userData.role?.includes('doctor')) {
          navigate('/admin', { replace: true });
        } else if (userData.role?.includes('rep')) {
          navigate('/rep/home', { replace: true });
        }
      }
    }
  }, [user, userData, loading, isPlatformAdmin, navigate, location]);

  // If user is authenticated with Google but has no users/{uid} document, show RoleChooser (skip for platform admin)
  if (!loading && user && !userData && user.email?.toLowerCase() !== 'onemediapp@gmail.com' && !isPlatformAdmin) {
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
        if (error.code === 'auth/unauthorized-domain') {
          setAuthError(`Domain unauthorized: ${window.location.hostname}. Please add this domain to Firebase Console > Authentication > Settings > Authorized domains.`);
        } else if (error.code === 'auth/popup-blocked') {
          setAuthError('Sign-in popup was blocked by browser. Please enable popups and retry.');
        } else {
          setAuthError(error.message || `Sign-in failed (${error.code || 'unknown'}). Please try again.`);
        }
      }
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 text-ink flex flex-col font-sans selection:bg-amber-100 selection:text-sand-600">
      
      {/* ── Top Full-bleed Midnight Hero ───────────────────────────────────── */}
      <section className="bg-gradient-to-b from-navy-950 via-navy-900 to-navy-900 text-cream-50 pt-9 pb-16 px-4 sm:px-8 relative overflow-hidden">
        {/* Subtle atmospheric ambient glows */}
        <div className="absolute top-[-10%] left-[-5%] w-96 h-96 rounded-full bg-teal-500/15 blur-3xl pointer-events-none" />
        <div className="absolute top-[20%] right-[-10%] w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[30%] w-80 h-80 rounded-full bg-teal-600/10 blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto relative z-10">
          {/* Header Bar */}
          <div className="flex items-center justify-between mb-8">
            {/* Wordmark (Sora 700) with small amber notch icon */}
            <div className="flex items-center gap-2.5">
              <span className="font-display font-bold text-2xl tracking-tight text-white flex items-center gap-2">
                Gatepass
              </span>
              <span className="w-2.5 h-2.5 rounded-[0.25rem] bg-amber-400 transform rotate-45 inline-block shadow-[0_0_10px_rgba(251,191,36,0.8)]" />
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[0.6875rem] font-mono text-white/90">
                <LiveDot size="sm" /> Zero-Wait Protocol
              </span>
              <MonoTag variant="neutral" className="bg-white/10 text-cream-50 border-white/20">
                Beta · Kurnool
              </MonoTag>
            </div>
          </div>

          {/* Hero Content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-200 text-xs font-semibold backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Remedi Clinic Beta Access
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold tracking-tight text-white leading-[1.06]">
                Walk in. <br />
                <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 bg-clip-text text-transparent">
                  Don't wait.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal pt-1 max-w-xl">
                The structured appointment and anti-fraud pass protocol for doctors and pharmaceutical representatives.
              </p>

              {/* Value prop pills */}
              <div className="pt-2 flex flex-wrap gap-2 text-xs text-slate-300 font-medium">
                <span className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 px-2.5 py-1 rounded-[0.625rem]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" /> Confirmed Slots
                </span>
                <span className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 px-2.5 py-1 rounded-[0.625rem]">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-400" /> Live Security Pass
                </span>
                <span className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 px-2.5 py-1 rounded-[0.625rem]">
                  <Clock className="w-3.5 h-3.5 text-teal-400" /> Zero Waiting Time
                </span>
              </div>
            </div>

            {/* Visual Teaser Pass Stub */}
            <div className="hidden lg:block lg:col-span-5">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[1.5rem] p-4 text-white shadow-2xl relative transform rotate-1 hover:rotate-0 transition-transform duration-300">
                <div className="flex items-center justify-between pb-3 border-b border-white/15">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                    <span className="font-mono text-[0.625rem] uppercase tracking-wider text-teal-300 font-bold">
                      Active Pass Sample
                    </span>
                  </div>
                  <span className="font-mono text-xs font-bold bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/30">
                    #RM-2048
                  </span>
                </div>
                <div className="py-3">
                  <p className="text-[0.625rem] font-mono uppercase text-slate-400">Consultation With</p>
                  <p className="text-sm font-display font-bold text-white">Dr. T. Karthik</p>
                  <p className="text-xs text-teal-200">Remedi Clinic · 2:00 – 2:20 PM</p>
                </div>
                <div className="pt-2 border-t border-dashed border-white/20 flex items-center justify-between text-[0.6875rem] text-slate-300 font-mono">
                  <span>SHOW AT RECEPTION</span>
                  <span className="text-teal-300 font-bold">VERIFIED ENTRY</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Perforated bottom edge */}
        <div className="absolute bottom-0 left-0 right-0">
          <Perforation bgClass="bg-cream-50" className="my-0" />
        </div>
      </section>

      {/* ── Main Action Section (Boarding Pass Stub Selector) ─────────── */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-8 -mt-6 z-10 pb-16">
        <div className="bg-white rounded-[1.75rem] border border-line shadow-[0_12px_36px_-12px_rgba(15,23,42,0.08),0_1px_3px_rgba(15,23,42,0.04)] p-6 sm:p-10">
          
          <div className="mb-6">
            <h2 className="text-xl font-display font-bold text-ink">
              Choose Your Portal
            </h2>
            <p className="text-xs sm:text-sm text-ink-soft mt-1">
              Select your role to access your dedicated Gatepass dashboard
            </p>
          </div>

          {authError && (
            <div className="mb-6 p-4 rounded-[1rem] bg-coral-50 border border-coral-600/30 text-coral-600 text-xs font-semibold leading-relaxed">
              {authError}
            </div>
          )}

          {/* Two Boarding-Pass-Stub Role Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            
            {/* Rep Stub */}
            <div
              onClick={() => setSelectedRole('rep')}
              className={`p-5 rounded-[1.25rem] border-2 cursor-pointer transition-all duration-200 relative select-none ${
                selectedRole === 'rep'
                  ? 'border-navy-900 border-l-[0.375rem] border-l-amber-500 bg-slate-50/80 shadow-md ring-1 ring-navy-900/10'
                  : 'border-line border-l-[0.375rem] border-l-line hover:border-slate-300 bg-white hover:shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-[0.875rem] bg-navy-100 text-navy-900 flex items-center justify-center font-bold shadow-2xs">
                  <Briefcase className="w-5 h-5" />
                </div>
                <MonoTag variant="neutral">MR PASS</MonoTag>
              </div>
              <h3 className="font-display font-bold text-base sm:text-lg text-ink">Pharma Representative</h3>
              <p className="text-xs text-ink-soft mt-1 leading-snug">
                Book verified consultation slots, get live tokens, and avoid clinic waiting rooms.
              </p>
              {selectedRole === 'rep' && (
                <div className="mt-3 flex items-center gap-1 text-[0.6875rem] font-bold text-navy-900">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" /> Selected for Google Sign-In
                </div>
              )}
            </div>

            {/* Doctor Stub */}
            <div
              onClick={() => setSelectedRole('doctor')}
              className={`p-5 rounded-[1.25rem] border-2 cursor-pointer transition-all duration-200 relative select-none ${
                selectedRole === 'doctor'
                  ? 'border-navy-900 border-l-[0.375rem] border-l-amber-500 bg-slate-50/80 shadow-md ring-1 ring-navy-900/10'
                  : 'border-line border-l-[0.375rem] border-l-line hover:border-slate-300 bg-white hover:shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-[0.875rem] bg-teal-50 text-teal-600 flex items-center justify-center font-bold shadow-2xs">
                  <Activity className="w-5 h-5" />
                </div>
                <MonoTag variant="amber">Invite Only</MonoTag>
              </div>
              <h3 className="font-display font-bold text-base sm:text-lg text-ink">Doctor</h3>
              <p className="text-xs text-ink-soft mt-1 leading-snug">
                Publish exact visit hours, approve vetted representatives, and protect patient care.
              </p>
              {selectedRole === 'doctor' && (
                <div className="mt-3 flex items-center gap-1 text-[0.6875rem] font-bold text-navy-900">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" /> Selected for Google Sign-In
                </div>
              )}
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="space-y-4">
            <button
              onClick={() => handleGoogleSignIn(selectedRole)}
              disabled={isSigningIn}
              className="w-full flex items-center justify-center gap-3 bg-navy-900 hover:bg-navy-800 text-white font-bold rounded-[1rem] px-6 py-4 transition-all duration-150 shadow-md hover:shadow-lg active:scale-[0.99] disabled:opacity-70 text-sm sm:text-base border border-navy-700/50 cursor-pointer"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="var(--color-google-blue)"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="var(--color-google-green)"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="var(--color-google-yellow)"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="var(--color-google-red)"/>
              </svg>
              <span>{isSigningIn ? 'Connecting to Google...' : `Continue with Google as ${selectedRole === 'doctor' ? 'Doctor' : 'Pharma Rep'}`}</span>
              <ArrowRight className="w-4 h-4 ml-1 opacity-70" />
            </button>

            <div className="flex items-center justify-between text-xs text-ink-mute pt-1">
              <span>🔒 100% Secure Firebase Auth</span>
              <span>Doctors: invite-only during beta</span>
            </div>
          </div>

          {/* Quick Pilot Portals Directory */}
          <div className="mt-8 pt-6 border-t border-line/60">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[0.6875rem] font-mono uppercase tracking-wider font-bold text-slate-400">
                Gatepass 2.0 Portals & Live Pilot
              </span>
              <span className="text-[0.625rem] bg-teal-50 text-teal-700 font-mono font-bold px-2 py-0.5 rounded-full border border-teal-200">
                REMEDI Kurnool
              </span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <a
                href="/kiosk/karthik-remedi"
                className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-all flex flex-col gap-1 text-left group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 group-hover:text-teal-600 transition-colors">Reception Kiosk</span>
                  <span className="text-[0.625rem] font-mono text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200 font-bold">PIN 2026</span>
                </div>
                <span className="text-[0.6875rem] text-slate-500">Scan QR & Cabin tracker</span>
              </a>

              <a
                href="/clinic-admin"
                className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-all flex flex-col gap-1 text-left group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">Clinic Management</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                <span className="text-[0.6875rem] text-slate-500">Branches, staff & rules</span>
              </a>

              <a
                href="/enterprise"
                className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-all flex flex-col gap-1 text-left group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 group-hover:text-amber-600 transition-colors">Pharma Enterprise</span>
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                </div>
                <span className="text-[0.6875rem] text-slate-500">Field force, DCR & territory</span>
              </a>

              <a
                href="/platform-admin"
                className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-all flex flex-col gap-1 text-left group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">Platform Admin</span>
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                </div>
                <span className="text-[0.6875rem] text-slate-500">Verification & subscriptions</span>
              </a>

              <a
                href="/rep/search"
                className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-all flex flex-col gap-1 text-left group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 group-hover:text-purple-600 transition-colors">Doctor Discovery</span>
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                </div>
                <span className="text-[0.6875rem] text-slate-500">Kurnool doctor search</span>
              </a>

              <a
                href="/dr/karthik-remedi"
                className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-all flex flex-col gap-1 text-left group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 group-hover:text-teal-600 transition-colors">Doctor Booking</span>
                  <span className="w-2 h-2 rounded-full bg-teal-500" />
                </div>
                <span className="text-[0.6875rem] text-slate-500">Dr. T. Karthik live profile</span>
              </a>
            </div>
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
