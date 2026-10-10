import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../lib/firebase';
import { useAuth } from '../../lib/auth';
import { checkDoctorInvite } from '../../lib/db/invites';
import { Activity, Briefcase, AlertCircle, ArrowRight, LogOut, CheckCircle2 } from 'lucide-react';

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
    <div className="min-h-screen bg-[#FAFAF7] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-[1.75rem] border border-[#E8E6DF] shadow-[0_8px_24px_rgba(11,23,48,0.06)] p-6 sm:p-8">
        
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#0B1730] text-white font-bold text-xl mb-3 shadow-sm">
            G
          </div>
          <h1 className="text-2xl font-bold text-[#14213D] tracking-tight">Choose Your Role</h1>
          <p className="text-sm text-[#4A5772] mt-1">
            Signed in as <span className="font-semibold text-[#14213D]">{user?.email}</span>
          </p>
        </div>

        {/* Invite notice if blocked */}
        {inviteError && (
          <div className="mb-6 p-4 rounded-2xl bg-[#FDECEC] border border-[#D64545]/20 text-[#D64545] text-xs leading-relaxed space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p className="font-medium">{inviteError}</p>
            </div>
            <button
              onClick={handleSelectRep}
              className="w-full py-2.5 px-3 bg-white text-[#14213D] border border-[#E8E6DF] hover:bg-slate-50 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
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
            className="w-full text-left p-4 rounded-2xl border-2 border-[#E8E6DF] hover:border-[#0B1730] hover:bg-[#FAFAF7] transition-all group flex items-start gap-4"
          >
            <div className="w-11 h-11 rounded-xl bg-[#E6EAF2] text-[#0B1730] group-hover:bg-[#0B1730] group-hover:text-white flex items-center justify-center transition-colors flex-shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#14213D] text-base">Pharma Representative</span>
                <ArrowRight className="w-4 h-4 text-[#8390A8] group-hover:text-[#0B1730] group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-xs text-[#4A5772] mt-1 leading-snug">
                Book verified time slots with doctors, generate live passes, and track call reports.
              </p>
            </div>
          </button>

          {/* Doctor Option */}
          <button
            onClick={handleSelectDoctor}
            disabled={checkingInvite}
            className="w-full text-left p-4 rounded-2xl border-2 border-[#E8E6DF] hover:border-[#0B1730] hover:bg-[#FAFAF7] transition-all group flex items-start gap-4 disabled:opacity-60"
          >
            <div className="w-11 h-11 rounded-xl bg-[#E6F5F3] text-[#00897B] group-hover:bg-[#00897B] group-hover:text-white flex items-center justify-center transition-colors flex-shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#14213D] text-base">Doctor</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFF6E0] text-[#B7791F]">
                    Beta Invite
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#8390A8] group-hover:text-[#0B1730] group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-xs text-[#4A5772] mt-1 leading-snug">
                Manage clinic visit slots, review medical reps, and eliminate waiting room chaos.
              </p>
              {checkingInvite && (
                <p className="text-[11px] font-semibold text-[#00897B] mt-1">Checking beta invite...</p>
              )}
            </div>
          </button>
        </div>

        {/* Footer actions */}
        <div className="mt-8 pt-4 border-t border-[#E8E6DF] flex items-center justify-between text-xs text-[#8390A8]">
          <span>Gatepass Beta v0.2.0</span>
          <button
            onClick={() => logout()}
            className="inline-flex items-center gap-1 font-semibold text-[#D64545] hover:underline"
          >
            <LogOut className="w-3.5 h-3.5" /> Switch Google Account
          </button>
        </div>
      </div>
    </div>
  );
}
