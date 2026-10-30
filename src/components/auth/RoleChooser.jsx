/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../lib/firebase';
import { useAuth } from '../../lib/auth';
import { checkDoctorInvite } from '../../lib/db/invites';
import { Activity, Briefcase, AlertCircle, ArrowRight, LogOut, ShieldCheck } from 'lucide-react';
import MonoTag from '../ui/MonoTag';

export default function RoleChooser() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [checkingInvite, setCheckingInvite] = useState(false);
  const [inviteError, setInviteError] = useState('');

  const handleSelectRep = () => {
    navigate('/rep/register');
  };

  const handleSelectDoctor = async () => {
    if (!user || !user.email) return;
    setCheckingInvite(true);
    setInviteError('');

    try {
      const isInvited = await checkDoctorInvite(user.email);

      if (isInvited) {
        navigate('/doctor/register');
      } else {
        setInviteError('Doctor accounts are invite-only during beta. Please request an invite or continue as a Medical Representative.');
      }
    } catch (err) {
      console.error('Error checking beta invite:', err);
      setInviteError('Doctor accounts are invite-only during beta. Please request an invite or continue as a Medical Representative.');
    } finally {
      setCheckingInvite(false);
    }
  };

  useEffect(() => {
    const pendingRole = sessionStorage.getItem('pendingRole');
    if (pendingRole === 'rep') {
      sessionStorage.removeItem('pendingRole');
      navigate('/rep/register');
    } else if (pendingRole === 'doctor' && user?.email) {
      sessionStorage.removeItem('pendingRole');
      handleSelectDoctor();
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col justify-center items-center px-4 py-12 font-sans selection:bg-amber-100 selection:text-sand-600">
      <div className="w-full max-w-md bg-white rounded-[1.75rem] border border-line shadow-[0_12px_36px_-12px_rgba(15,23,42,0.08),0_1px_3px_rgba(15,23,42,0.04)] p-6 sm:p-8">
        
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-[1rem] bg-navy-900 text-white font-bold text-xl mb-3 shadow-md">
            G
          </div>
          <h1 className="text-2xl font-bold font-display text-ink tracking-tight">Choose Your Role</h1>
          <p className="text-xs sm:text-sm text-ink-soft mt-1">
            Signed in as <span className="font-semibold text-ink">{user?.email}</span>
          </p>
        </div>

        {/* Invite notice if blocked */}
        {inviteError && (
          <div className="mb-6 p-4 rounded-[1rem] bg-coral-50 border border-coral-600/30 text-coral-600 text-xs leading-relaxed space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p className="font-medium">{inviteError}</p>
            </div>
            <button
              onClick={handleSelectRep}
              className="w-full py-2.5 px-3 bg-white text-ink border border-line hover:bg-slate-50 font-bold rounded-[0.75rem] text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              Continue as Pharma Rep <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Role options */}
        <div className="space-y-3.5">
          {/* Pharma Rep Option */}
          <button
            onClick={handleSelectRep}
            className="w-full text-left p-4 rounded-[1.25rem] border-2 border-line hover:border-navy-900 hover:bg-slate-50/70 transition-all duration-200 group flex items-start gap-4 active:scale-[0.99] cursor-pointer"
          >
            <div className="w-11 h-11 rounded-[0.875rem] bg-navy-100 text-navy-900 group-hover:bg-navy-900 group-hover:text-white flex items-center justify-center transition-all duration-200 flex-shrink-0 shadow-2xs">
              <Briefcase className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-ink text-base">Pharma Representative</span>
                <ArrowRight className="w-4 h-4 text-ink-mute group-hover:text-navy-900 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-xs text-ink-soft mt-1 leading-snug">
                Book verified time slots with doctors, generate live passes, and track call reports.
              </p>
            </div>
          </button>

          {/* Doctor Option */}
          <button
            onClick={handleSelectDoctor}
            disabled={checkingInvite}
            className="w-full text-left p-4 rounded-[1.25rem] border-2 border-line hover:border-navy-900 hover:bg-slate-50/70 transition-all duration-200 group flex items-start gap-4 disabled:opacity-60 active:scale-[0.99] cursor-pointer"
          >
            <div className="w-11 h-11 rounded-[0.875rem] bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white flex items-center justify-center transition-all duration-200 flex-shrink-0 shadow-2xs">
              <Activity className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-ink text-base">Doctor</span>
                  <MonoTag variant="amber">Beta Invite</MonoTag>
                </div>
                <ArrowRight className="w-4 h-4 text-ink-mute group-hover:text-navy-900 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-xs text-ink-soft mt-1 leading-snug">
                Manage clinic visit slots, review medical reps, and eliminate waiting room chaos.
              </p>
              {checkingInvite && (
                <p className="text-xs font-semibold text-teal-600 mt-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping" /> Checking beta invite...
                </p>
              )}
            </div>
          </button>
        </div>

        {/* Footer actions */}
        <div className="mt-8 pt-4 border-t border-line flex items-center justify-between text-xs text-ink-mute">
          <span>Gatepass Beta</span>
          <button
            onClick={() => logout()}
            className="inline-flex items-center gap-1 font-semibold text-coral-600 hover:underline"
          >
            <LogOut className="w-3.5 h-3.5" /> Switch Account
          </button>
        </div>
      </div>
    </div>
  );
}
