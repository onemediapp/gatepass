import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Stethoscope, Briefcase, ChevronRight, Activity, CalendarCheck, 
  Building2, ShieldCheck, CheckCircle2, Phone, ArrowRight, 
  Sparkles, Clock, AlertTriangle, Users, QrCode
} from 'lucide-react';
import { loginWithGoogle } from '../lib/firebase';
import { useAuth } from '../lib/auth';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, userData, loading } = useAuth();
  const [roleSelection, setRoleSelection] = useState(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  
  // Mobile OTP Tab State
  const [authMethod, setAuthMethod] = useState('google'); // 'google' | 'phone'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpError, setOtpError] = useState('');

  useEffect(() => {
    if (!loading && user) {
      if (userData) {
        if (userData.role?.includes('doctor')) navigate('/admin');
        else if (userData.role?.includes('rep')) navigate('/rep/home');
      } else {
        const pendingRole = sessionStorage.getItem('pendingRole') || roleSelection;
        if (pendingRole === 'doctor') navigate('/doctor/register');
        else if (pendingRole === 'rep') navigate('/rep/register');
      }
    }
  }, [user, userData, loading, navigate, roleSelection]);

  const handleSignIn = async (role = null) => {
    try {
      setIsSigningIn(true);
      if (role) {
        setRoleSelection(role);
        sessionStorage.setItem('pendingRole', role);
      }
      await loginWithGoogle();
    } catch (error) {
      if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
        console.error('Sign-in error:', error);
      }
      setIsSigningIn(false);
    }
  };

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 10) {
      setOtpError('Please enter a valid 10-digit Indian mobile number');
      return;
    }
    setOtpError('');
    setOtpSent(true);
    setOtpValue('4528'); // Demo OTP preset for instant testability
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (otpValue.trim() !== '4528' && otpValue.trim().length !== 4) {
      setOtpError('Invalid OTP. Please enter 4528 for testing.');
      return;
    }
    // Set pending role and authenticate
    handleSignIn(roleSelection || 'rep');
  };

  if (loading) return null;

  return (
    <div className="flex flex-col min-h-screen bg-[#071120] text-slate-100 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Immersive Bharat Clinical Backdrop */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-emerald-500/10 blur-[130px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[130px]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-20"></div>
      </div>

      {/* Top Navbar */}
      <header className="relative z-20 border-b border-slate-800/80 bg-[#071120]/80 backdrop-blur-xl px-4 sm:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-emerald-500/20">
              G
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-display font-black tracking-tight text-white">Gatepass</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  INDIA HEALTH
                </span>
              </div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Clinic Protocol & Medical Detailing OS</p>
            </div>
          </div>

          {/* Quick Desk Link */}
          <div className="flex items-center gap-3">
            <Link
              to="/desk"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-800/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition-all"
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              Reception Desk Kiosk
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col justify-center max-w-6xl mx-auto w-full px-4 sm:px-8 py-10 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Clinical Positioning */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Standardized OPD Access for Doctors & Pharma
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-black tracking-tight text-white leading-[1.08]">
              Protect Patient Hours. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                Dignify Medical Detailing.
              </span>
            </h1>

            <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-xl font-normal">
              Eliminate chaotic clinic waiting rooms. Issue verified, time-stamped digital gatepasses, broadcast live doctor OPD delay beacons, and automate Pharma Daily Call Reports (DCR).
            </p>

            {/* Value Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2 font-bold">
                  👨‍⚕️
                </div>
                <h4 className="text-xs font-bold text-white">Doctor Control</h4>
                <p className="text-[11px] text-slate-400 mt-1">Multi-slot shifts & live delay beacon to avoid rep crowding.</p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-2 font-bold">
                  💼
                </div>
                <h4 className="text-xs font-bold text-white">MR Zero Wait</h4>
                <p className="text-[11px] text-slate-400 mt-1">Confirmed token queues & 1-tap WhatsApp entry passes.</p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-2 font-bold">
                  🏥
                </div>
                <h4 className="text-xs font-bold text-white">Front Desk Kiosk</h4>
                <p className="text-[11px] text-slate-400 mt-1">Receptionist admissions without sharing doctor passwords.</p>
              </div>
            </div>

            {/* Field Force Trust Proof */}
            <div className="pt-4 border-t border-slate-800/60">
              <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2">
                Designed for field forces detailing top therapeutic brands
              </p>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-bold text-slate-400">
                <span>Sun Pharma</span>
                <span>•</span>
                <span>Cipla</span>
                <span>•</span>
                <span>Mankind</span>
                <span>•</span>
                <span>Abbott</span>
                <span>•</span>
                <span>Torrent</span>
                <span>•</span>
                <span>Alkem</span>
              </div>
            </div>
          </div>

          {/* Right Column: High-Conversion Sign-In & Role Gateway */}
          <div className="lg:col-span-5">
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-lg font-display font-bold text-white">Access Portal</h3>
                  <p className="text-xs text-slate-400">Select role or sign in below</p>
                </div>

                {/* Auth Method Toggle */}
                <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
                  <button
                    onClick={() => setAuthMethod('google')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${authMethod === 'google' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                  >
                    Google
                  </button>
                  <button
                    onClick={() => setAuthMethod('phone')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${authMethod === 'phone' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                  >
                    +91 Phone
                  </button>
                </div>
              </div>

              {authMethod === 'google' ? (
                <div className="space-y-4">
                  <button 
                    onClick={() => handleSignIn()}
                    disabled={isSigningIn}
                    className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 font-bold rounded-2xl px-5 py-4 shadow-xl hover:bg-slate-100 transition-all active:scale-[0.98] disabled:opacity-70 text-sm"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    {isSigningIn ? 'Connecting to Gatepass...' : 'Continue with Google'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {!otpSent ? (
                    <form onSubmit={handleSendOtp} className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1.5">Indian Mobile Number</label>
                        <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5">
                          <span className="text-xs font-bold text-emerald-400 font-mono">🇮🇳 +91</span>
                          <input
                            type="tel"
                            maxLength={10}
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                            placeholder="98765 43210"
                            className="bg-transparent border-none text-white font-mono text-sm focus:outline-none w-full"
                          />
                        </div>
                      </div>

                      {otpError && <p className="text-rose-400 text-xs font-semibold">{otpError}</p>}

                      <button
                        type="submit"
                        className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold rounded-xl text-sm transition-all shadow-lg"
                      >
                        Send Verification OTP
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-3">
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-300">
                        OTP sent to +91 {phoneNumber}. (Test Code: <strong>4528</strong>)
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1.5">Enter 4-Digit OTP</label>
                        <input
                          type="text"
                          maxLength={4}
                          value={otpValue}
                          onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                          placeholder="4528"
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono tracking-widest text-center text-lg focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      {otpError && <p className="text-rose-400 text-xs font-semibold">{otpError}</p>}

                      <button
                        type="submit"
                        disabled={isSigningIn}
                        className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold rounded-xl text-sm transition-all shadow-lg"
                      >
                        {isSigningIn ? 'Logging In...' : 'Verify OTP & Continue'}
                      </button>
                    </form>
                  )}
                </div>
              )}

              <div className="relative flex items-center py-6">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink-0 mx-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Direct Role Launch
                </span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              {/* Direct Role Entry Cards */}
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => handleSignIn('doctor')}
                  disabled={isSigningIn}
                  className="flex flex-col items-center justify-center p-4 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/50 rounded-2xl transition-all active:scale-[0.98] group text-center"
                >
                  <div className="w-10 h-10 bg-emerald-500/10 group-hover:bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center mb-2 transition-colors">
                    <Activity className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-white text-sm">I'm a Doctor</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Clinic OPD & Shifts</span>
                </button>

                <button 
                  onClick={() => handleSignIn('rep')}
                  disabled={isSigningIn}
                  className="flex flex-col items-center justify-center p-4 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/50 rounded-2xl transition-all active:scale-[0.98] group text-center"
                >
                  <div className="w-10 h-10 bg-blue-500/10 group-hover:bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center mb-2 transition-colors">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-white text-sm">I'm a Pharma Rep</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Gatepass & Visits</span>
                </button>
              </div>

              {/* Reception Desk Front Office Access */}
              <div className="mt-4 pt-4 border-t border-slate-800">
                <Link
                  to="/desk"
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-800/50 hover:bg-slate-800 rounded-xl border border-slate-700/60 text-xs font-semibold text-slate-300 hover:text-white transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4 text-emerald-400" />
                    <span>Clinic Receptionist / Compounder Kiosk</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
