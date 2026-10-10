import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../lib/firebase';
import { useAuth } from '../../lib/auth';
import { checkDoctorInvite } from '../../lib/db/invites';
import { Activity, Briefcase, AlertCircle, ArrowRight, LogOut } from 'lucide-react';
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
        setInviteError('Doctor accounts are invite-only during beta. Ask Dr. Karthik for an invite.');
      }
    } catch (err) {
      console.error('Error checking beta invite:', err);
      setInviteError('Doctor accounts are invite-only during beta. Ask Dr. Karthik for an invite.');
    } finally {
      setCheckingInvite(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-[1.75rem] border border-line shadow-[0_8px_24px_rgba(11,23,48,0.06)] p-6 sm:p-8">
        
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-[1rem] bg-navy-900 text-white font-bold text-xl mb-3 shadow-sm">
            G
          </div>
          <h1 className="text-2xl font-bold font-display text-ink tracking-tight">Choose Your Role</h1>
          <p className="text-sm text-ink-soft mt-1">
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
              className="w-full py-2.5 px-3 bg-white text-ink border border-line hover:bg-cream-50 font-bold rounded-[0.75rem] text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              Continue as Pharma Rep <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Role options */}
        <div className="space-y-3">
          {/* Pharma Rep Option */}
          <button
            onClick={handleSelectRep}
            className="w-full text-left p-4 rounded-[1rem] border-2 border-line hover:border-navy-900 hover:bg-cream-50 transition-all group flex items-start gap-4"
          >
            <div className="w-11 h-11 rounded-[0.75rem] bg-navy-100 text-navy-900 group-hover:bg-navy-900 group-hover:text-white flex items-center justify-center transition-colors flex-shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-ink text-base">Pharma Representative</span>
                <ArrowRight className="w-4 h-4 text-ink-mute group-hover:text-navy-900 group-hover:translate-x-0.5 transition-all" />
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
            className="w-full text-left p-4 rounded-[1rem] border-2 border-line hover:border-navy-900 hover:bg-cream-50 transition-all group flex items-start gap-4 disabled:opacity-60"
          >
            <div className="w-11 h-11 rounded-[0.75rem] bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white flex items-center justify-center transition-colors flex-shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-ink text-base">Doctor</span>
                  <MonoTag variant="amber">Beta Invite</MonoTag>
                </div>
                <ArrowRight className="w-4 h-4 text-ink-mute group-hover:text-navy-900 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-xs text-ink-soft mt-1 leading-snug">
                Manage clinic visit slots, review medical reps, and eliminate waiting room chaos.
              </p>
              {checkingInvite && (
                <p className="text-xs font-semibold text-teal-600 mt-1">Checking beta invite...</p>
              )}
            </div>
          </button>
        </div>

        {/* Footer actions */}
        <div className="mt-8 pt-4 border-t border-line flex items-center justify-between text-xs text-ink-mute">
          <span>Gatepass Beta v0.2.0</span>
          <button
            onClick={() => logout()}
            className="inline-flex items-center gap-1 font-semibold text-coral-600 hover:underline"
          >
            <LogOut className="w-3.5 h-3.5" /> Switch Google Account
          </button>
        </div>
      </div>
    </div>
  );
}
