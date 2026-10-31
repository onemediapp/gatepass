/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscribeActiveNotices } from '../../lib/db/notices';
import { useAuth } from '../../lib/auth';
import { 
  BellRing, 
  Search, 
  MapPin, 
  ChevronRight, 
  AlertCircle, 
  Sparkles, 
  Clock, 
  Calendar,
  Building2,
  Stethoscope,
  Info,
  XCircle,
  Megaphone,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { RepBottomNav } from '../../components/layout/RepBottomNav';
import EdgeCard from '../../components/ui/EdgeCard';
import MonoTag from '../../components/ui/MonoTag';
import Skeleton from '../../components/ui/Skeleton';
import { cn } from '../../lib/utils';

export default function RepNotices() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All'); // 'All' | 'Looking For' | 'Not Accepting' | 'Closure' | 'Info'
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const unsub = subscribeActiveNotices((data) => {
      if (data && data.length > 0) {
        setNotices(data);
      } else {
        // Fallback reference pilot notices matching Image 14 Screen 1
        setNotices([
          {
            id: 'notice-1',
            type: 'looking_for',
            typeLabel: 'Looking For',
            doctorName: 'Dr. K. Ramya',
            specialty: 'Dermatology & Cosmetology',
            clinicName: 'Remedi Clinic, Kurnool',
            dateStr: 'Today, 10:30 AM',
            title: 'Looking for Derma & Aesthetic Representatives',
            content: 'Looking for representatives from Derma, Skin care and Aesthetic products.',
            doctorSlug: 'karthik-remedi'
          },
          {
            id: 'notice-2',
            type: 'info',
            typeLabel: 'Information',
            doctorName: 'Dr. T. Karthik',
            specialty: 'General Medicine',
            clinicName: 'Remedi Clinic, Kurnool',
            dateStr: 'Today, 09:15 AM',
            title: 'Shift to Evening Consultation',
            content: 'Will be available only in the evening today (6 PM – 9 PM).',
            doctorSlug: 'karthik-remedi'
          },
          {
            id: 'notice-3',
            type: 'closure',
            typeLabel: 'Clinic Closure',
            doctorName: 'Dr. D V Subba Reddy',
            specialty: 'Orthopedics',
            clinicName: 'Remedi Clinic, Kurnool',
            dateStr: '28 Oct 2026',
            title: 'Diwali & CME Leave Notice',
            content: 'Clinic will be closed on 2 Nov 2026 (Monday) due to CME.',
            doctorSlug: 'karthik-remedi'
          },
          {
            id: 'notice-4',
            type: 'not_accepting',
            typeLabel: 'Not Accepting',
            doctorName: 'Dr. S. Narayana',
            specialty: 'Cardiology',
            clinicName: 'City Care Clinic, Kurnool',
            dateStr: '27 Oct 2026',
            title: 'Antibiotic Category Restricted',
            content: 'Not accepting representatives from antibiotic category this week.',
            doctorSlug: 'karthik-remedi'
          }
        ]);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const categories = ['All', 'Looking For', 'Not Accepting', 'Closure', 'Info'];

  const filteredNotices = useMemo(() => {
    return notices.filter((n) => {
      // Category filter
      if (activeCategory === 'Looking For' && n.type !== 'looking_for') return false;
      if (activeCategory === 'Not Accepting' && n.type !== 'not_accepting') return false;
      if (activeCategory === 'Closure' && n.type !== 'closure') return false;
      if (activeCategory === 'Info' && n.type !== 'info' && n.type !== 'information') return false;

      // Text query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          n.doctorName?.toLowerCase().includes(q) ||
          n.clinicName?.toLowerCase().includes(q) ||
          n.content?.toLowerCase().includes(q) ||
          n.title?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [notices, activeCategory, searchQuery]);

  const getBadgeStyle = (type) => {
    switch (type) {
      case 'looking_for':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-300',
          icon: Megaphone,
          iconColor: 'text-amber-600',
          iconBg: 'bg-amber-100'
        };
      case 'closure':
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-300',
          icon: AlertCircle,
          iconColor: 'text-rose-600',
          iconBg: 'bg-rose-100'
        };
      case 'not_accepting':
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-300',
          icon: XCircle,
          iconColor: 'text-slate-600',
          iconBg: 'bg-slate-200'
        };
      default:
        return {
          bg: 'bg-blue-50 text-blue-800 border-blue-300',
          icon: Info,
          iconColor: 'text-blue-600',
          iconBg: 'bg-blue-100'
        };
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 font-sans pb-28 selection:bg-amber-100 selection:text-sand-600">
      
      {/* ── Top Header (Image 14 Screen 1) ─────────────────────────── */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-line px-4 sm:px-6 py-4 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-display font-bold text-ink tracking-tight">
                Clinic Notices
              </h1>
              <p className="text-xs text-ink-soft mt-0.5">
                Important updates from doctors and clinics you visit
              </p>
            </div>
            <div className="w-10 h-10 rounded-[0.875rem] bg-amber-50 text-amber-700 border border-amber-300 flex items-center justify-center font-bold">
              <BellRing className="w-5 h-5 text-amber-600" />
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer",
                  activeCategory === cat
                    ? "bg-navy-900 text-white shadow-sm"
                    : "bg-white text-slate-600 border border-line hover:bg-cream-100"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── Notices Feed ───────────────────────────────────────────── */}
      <main className="max-w-2xl mx-auto p-4 sm:p-6 space-y-3.5">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="w-full h-32 rounded-[1.25rem]" />
            ))}
          </div>
        ) : filteredNotices.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-[1.25rem] border border-line space-y-2">
            <BellRing className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h3 className="font-display font-bold text-sm text-ink">No Active Notices</h3>
            <p className="text-xs text-ink-soft">There are no notices under this category right now.</p>
          </div>
        ) : (
          filteredNotices.map((notice) => {
            const badge = getBadgeStyle(notice.type);
            const Icon = badge.icon;

            return (
              <div
                key={notice.id}
                onClick={() => {
                  if (notice.doctorSlug) {
                    navigate(`/dr/${notice.doctorSlug}`);
                  }
                }}
                className="p-4 sm:p-5 rounded-[1.25rem] bg-white border border-line shadow-2xs hover:border-navy-500/30 transition-all cursor-pointer group active:scale-[0.99] space-y-3"
              >
                {/* Doctor and Clinic Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={cn("w-10 h-10 rounded-[0.875rem] flex items-center justify-center flex-shrink-0 mt-0.5", badge.iconBg)}>
                      <Icon className={cn("w-5 h-5", badge.iconColor)} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={cn("px-2 py-0.5 rounded-full text-[0.625rem] font-mono font-bold border", badge.bg)}>
                          {notice.typeLabel || 'Notice'}
                        </span>
                        <span className="text-[0.6875rem] text-slate-400 font-mono">
                          {notice.dateStr || 'Recent'}
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-sm text-ink group-hover:text-navy-900 transition-colors mt-1">
                        {notice.doctorName}
                      </h3>
                      <p className="text-xs text-ink-soft">
                        {notice.clinicName || 'Remedi Clinic'}
                      </p>
                    </div>
                  </div>

                  <div className="p-1.5 rounded-[0.625rem] bg-cream-50 group-hover:bg-navy-100 text-slate-400 group-hover:text-ink transition-colors flex-shrink-0">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>

                {/* Content */}
                <div className="p-3 rounded-[0.875rem] bg-cream-50/70 border border-line/60 text-xs text-ink leading-relaxed">
                  {notice.content}
                </div>

                {/* Footer action if looking for reps */}
                {notice.type === 'looking_for' && (
                  <div className="flex items-center justify-between text-[0.6875rem] text-teal-700 font-semibold pt-1">
                    <span>Doctor actively welcoming visits</span>
                    <span className="flex items-center gap-1 font-bold">
                      Book Appointment <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </main>

      {/* Rep Bottom Navigation */}
      <RepBottomNav />
    </div>
  );
}
