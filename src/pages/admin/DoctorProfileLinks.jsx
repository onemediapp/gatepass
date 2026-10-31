/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { listClinicsByDoctor } from '../../lib/db/clinics';
import { useAuth } from '../../lib/auth';
import { 
  Copy, 
  Check, 
  QrCode, 
  Download, 
  ExternalLink, 
  Printer, 
  Building2, 
  MapPin, 
  MessageCircle,
  Share2
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import EdgeCard from '../../components/ui/EdgeCard';
import Skeleton from '../../components/ui/Skeleton';
import MonoTag from '../../components/ui/MonoTag';
import { cn } from '../../lib/utils';
import { Link } from 'react-router-dom';

export default function DoctorProfileLinks() {
  const { user, userData } = useAuth();
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedSlug, setCopiedSlug] = useState(null);
  const [activeTab, setActiveTab] = useState('Clinic QR'); // 'Clinic QR' | 'Booking Link' | 'Print Materials'

  useEffect(() => {
    async function loadClinics() {
      if (!user) return;
      try {
        const data = await listClinicsByDoctor(user.uid);
        if (data && data.length > 0) {
          setClinics(data);
        } else {
          // Default fallback clinic for Remedi Clinic Kurnool pilot
          setClinics([
            {
              id: 'remedi-kurnool-main',
              name: 'Remedi Clinic',
              clinicName: 'Remedi Clinic',
              slug: 'karthik-remedi',
              address: 'Beside Vijaya Diagnostics, Gayathri Estates, Kurnool, Andhra Pradesh',
              isPrimary: true
            }
          ]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadClinics();
  }, [user]);

  const copyToClipboard = (url, slug) => {
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const handleDownloadQR = (clinicSlug, clinicName) => {
    const svg = document.getElementById(`qr-svg-${clinicSlug}`);
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width + 40;
      canvas.height = img.height + 40;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 20, 20);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `${clinicName || 'Clinic'}-GatePass-QR.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  if (loading) {
    return (
      <div className="pb-10 max-w-2xl mx-auto space-y-4 font-sans">
        <Skeleton className="w-48 h-8 rounded-[0.75rem]" />
        <Skeleton className="w-full h-12 rounded-[1rem]" />
        <Skeleton className="w-full h-80 rounded-[1.25rem]" />
      </div>
    );
  }

  const primaryClinic = clinics.find(c => c.isPrimary) || clinics[0];
  const bookingUrl = `${window.location.origin}/dr/${primaryClinic?.slug || 'karthik-remedi'}`;
  const whatsappShareText = encodeURIComponent(
    `Hello, here is my Gatepass profile to book an appointment with Dr. ${userData?.name || 'Karthik'}:\n\n${bookingUrl}`
  );

  return (
    <div className="pb-12 max-w-2xl mx-auto font-sans selection:bg-amber-100 selection:text-sand-600 space-y-6">
      
      {/* ── Top Header ───────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl sm:text-2xl font-display font-bold text-ink tracking-tight">
          QR & Booking Links
        </h1>
        <p className="text-xs text-ink-soft mt-0.5">
          Share your clinic QR and booking link with representatives.
        </p>
      </div>

      {/* ── Sub-navigation Tabs (Image 1 Screen 1) ───────────────── */}
      <div className="flex items-center bg-cream-100/80 p-1 rounded-[1rem] border border-line">
        {['Clinic QR', 'Booking Link', 'Print Materials'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 py-2 text-xs font-semibold rounded-[0.75rem] transition-all text-center",
              activeTab === tab
                ? "bg-navy-900 text-white shadow-sm"
                : "text-slate-600 hover:text-ink hover:bg-white/50"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Tab 1: Clinic QR ─────────────────────────────────────── */}
      {activeTab === 'Clinic QR' && primaryClinic && (
        <div className="space-y-6">
          {/* Clinic Details Card */}
          <div className="bg-white rounded-[1.25rem] border border-line p-5 sm:p-6 shadow-2xs space-y-6">
            
            {/* Header with primary badge */}
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-[1rem] bg-teal-50 border border-teal-500/20 text-teal-700 flex items-center justify-center flex-shrink-0 shadow-2xs">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-display font-bold text-ink truncate">
                    {primaryClinic.clinicName || primaryClinic.name}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[0.625rem] font-mono font-bold bg-teal-50 text-teal-700 border border-teal-200">
                    Primary
                  </span>
                </div>
                <p className="text-xs text-ink-soft mt-0.5 flex items-start gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <span>{primaryClinic.address || 'Beside Vijaya Diagnostics, Gayathri Estates, Kurnool, Andhra Pradesh'}</span>
                </p>
              </div>
            </div>

            {/* QR Code and Instructions Box */}
            <div className="p-5 bg-slate-50/70 border border-line rounded-[1rem] flex flex-col sm:flex-row items-center gap-5">
              <div className="p-3 bg-white rounded-[0.875rem] border border-line shadow-2xs flex-shrink-0 relative">
                <QRCodeSVG
                  id={`qr-svg-${primaryClinic.slug}`}
                  value={bookingUrl}
                  size={140}
                  level="H"
                  includeMargin={false}
                  className="w-36 h-36"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-7 h-7 rounded-[0.5rem] bg-teal-600 text-white flex items-center justify-center font-bold text-xs shadow-md border-2 border-white">
                    G
                  </div>
                </div>
              </div>

              <div className="flex-1 text-center sm:text-left space-y-3">
                <div>
                  <h3 className="font-display font-bold text-sm text-ink">
                    Scan to Request a Visit
                  </h3>
                  <p className="text-xs text-ink-soft mt-1 leading-relaxed">
                    Representatives can scan this QR code to view your profile and request an appointment.
                  </p>
                </div>

                <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                  <button
                    onClick={() => handleDownloadQR(primaryClinic.slug, primaryClinic.clinicName || primaryClinic.name)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[0.75rem] bg-white border border-line hover:bg-cream-100 text-ink text-xs font-semibold shadow-2xs active:scale-95 transition-all"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                    <span>Download QR</span>
                  </button>
                  <button
                    onClick={() => copyToClipboard(bookingUrl, primaryClinic.slug)}
                    className="p-2 rounded-[0.75rem] bg-white border border-line hover:bg-cream-100 text-ink text-xs font-semibold shadow-2xs active:scale-95 transition-all"
                    title="Copy QR URL"
                  >
                    {copiedSlug === primaryClinic.slug ? (
                      <Check className="w-4 h-4 text-teal-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-600" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Direct Booking Link Section */}
            <div className="space-y-2 pt-2 border-t border-line">
              <label className="block text-xs font-bold text-ink">
                Direct Booking Link
              </label>
              <p className="text-[0.6875rem] text-ink-soft">
                Share this link via WhatsApp, email or other channels.
              </p>

              <div className="flex items-center bg-cream-50 rounded-[0.875rem] border border-line p-1">
                <div className="flex-1 px-3 py-2 font-mono text-xs text-ink truncate select-all">
                  {bookingUrl}
                </div>
                <button
                  onClick={() => copyToClipboard(bookingUrl, primaryClinic.slug)}
                  className="bg-navy-900 hover:bg-navy-800 text-white px-4 py-2 rounded-[0.625rem] font-bold text-xs transition-all active:scale-95 shadow-sm flex items-center gap-1.5"
                >
                  {copiedSlug === primaryClinic.slug ? (
                    <><Check className="w-3.5 h-3.5 text-teal-300" /> Copied</>
                  ) : (
                    <><Copy className="w-3.5 h-3.5 text-slate-300" /> Copy</>
                  )}
                </button>
              </div>

              {/* Action Buttons: WhatsApp and Open Link */}
              <div className="flex items-center gap-2.5 pt-2">
                <a
                  href={`https://wa.me/?text=${whatsappShareText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[0.875rem] bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold text-xs shadow-sm transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Share on WhatsApp</span>
                </a>

                <a
                  href={bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-[0.875rem] bg-white border border-line hover:bg-cream-100 active:scale-95 text-ink font-semibold text-xs shadow-2xs transition-all"
                >
                  <ExternalLink className="w-4 h-4 text-slate-500" />
                  <span>Open Link</span>
                </a>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── Tab 2: Booking Link ──────────────────────────────────── */}
      {activeTab === 'Booking Link' && (
        <div className="space-y-4">
          <div className="bg-white rounded-[1.25rem] border border-line p-5 shadow-2xs space-y-4">
            <h3 className="font-display font-bold text-sm text-ink">
              All Active Clinic Booking Links
            </h3>
            <div className="divide-y divide-line space-y-3">
              {clinics.map((clinic) => {
                const url = `${window.location.origin}/dr/${clinic.slug}`;
                return (
                  <div key={clinic.id} className="pt-3 first:pt-0 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-ink">{clinic.clinicName || clinic.name}</span>
                      {clinic.isPrimary && <MonoTag variant="teal">Primary</MonoTag>}
                    </div>
                    <div className="flex items-center bg-cream-50 rounded-[0.75rem] border border-line p-1">
                      <span className="flex-1 px-3 py-1.5 font-mono text-xs text-slate-700 truncate">{url}</span>
                      <button
                        onClick={() => copyToClipboard(url, clinic.id)}
                        className="p-1.5 rounded-[0.5rem] bg-white border border-line hover:bg-cream-100 text-xs text-ink"
                      >
                        {copiedSlug === clinic.id ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 3: Print Materials ──────────────────────────────── */}
      {activeTab === 'Print Materials' && (
        <div className="space-y-4">
          <div className="bg-white rounded-[1.25rem] border border-line p-5 sm:p-6 shadow-2xs space-y-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-[0.875rem] bg-navy-50 text-navy-900 flex items-center justify-center flex-shrink-0">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm text-ink">
                  Reception Desk QR Standees & Posters
                </h3>
                <p className="text-xs text-ink-soft mt-0.5">
                  Print ready-to-use high-resolution counter cards to display at reception desk so visiting medical representatives scan upon arrival.
                </p>
              </div>
            </div>

            <div className="border border-line rounded-[1rem] p-4 bg-cream-50 flex items-center justify-between">
              <div>
                <p className="font-display font-bold text-xs text-ink">Counter Display Poster (A4 / A5)</p>
                <p className="text-[0.6875rem] text-ink-soft">Includes doctor credentials, visiting hours, and instant scan QR.</p>
              </div>
              <Link
                to={`/print/clinic/${primaryClinic?.id || 'remedi-kurnool-main'}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[0.75rem] bg-navy-900 text-white font-semibold text-xs shadow-sm hover:bg-navy-800 transition-all"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Open Printable</span>
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
