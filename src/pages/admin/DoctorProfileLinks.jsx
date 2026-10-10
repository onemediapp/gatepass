import React, { useState, useEffect } from 'react';
import { listClinicsByDoctor } from '../../lib/db/clinics';
import { useAuth } from '../../lib/auth';
import { Copy, Check, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import EdgeCard from '../../components/ui/EdgeCard';
import Skeleton from '../../components/ui/Skeleton';
import MonoTag from '../../components/ui/MonoTag';

export default function DoctorProfileLinks() {
  const { user } = useAuth();
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedSlug, setCopiedSlug] = useState(null);

  useEffect(() => {
    async function loadClinics() {
      if (!user) return;
      try {
        const data = await listClinicsByDoctor(user.uid);
        setClinics(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadClinics();
  }, [user]);

  const copyToClipboard = (slug) => {
    navigator.clipboard.writeText(`${window.location.origin}/clinic/${slug}`);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  if (loading) {
    return (
      <div className="pb-10 max-w-4xl mx-auto space-y-4 font-sans">
        <Skeleton className="w-48 h-8 rounded-[0.75rem]" />
        <Skeleton className="w-full h-52 rounded-[1.25rem]" />
      </div>
    );
  }

  const displayHost = window.location.host;

  return (
    <div className="pb-10 max-w-4xl mx-auto font-sans selection:bg-amber-100 selection:text-sand-600">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-ink tracking-tight">Clinic QR & Booking Links</h1>
        <p className="text-ink-soft text-xs mt-0.5">Share these links or print QR posters for reps at reception.</p>
      </div>

      {clinics.length === 0 ? (
        <div className="text-center py-12 text-ink-mute font-medium bg-white rounded-[1.25rem] border border-line border-dashed text-xs">
          You haven't set up any clinics yet. Go to Practice Locations to add one.
        </div>
      ) : (
        <div className="space-y-4">
          {clinics.map(clinic => (
            <EdgeCard key={clinic.id} edge="navy" className="p-6 flex flex-col md:flex-row items-center gap-6">
              <div className="flex-shrink-0 bg-white p-3 rounded-[1rem] border border-line shadow-sm">
                <QRCodeSVG 
                  value={`${window.location.origin}/clinic/${clinic.slug}`} 
                  size={140}
                  level="H"
                  includeMargin={false}
                  className="w-36 h-36"
                />
              </div>
              
              <div className="flex-1 flex flex-col justify-center min-w-0 w-full text-center md:text-left">
                <div className="mb-3">
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                    <h2 className="text-lg font-display font-bold text-ink truncate">{clinic.clinicName || clinic.name}</h2>
                    <MonoTag variant="neutral">Active QR</MonoTag>
                  </div>
                  <p className="text-ink-soft text-xs">{clinic.address}</p>
                </div>
                
                <div className="mt-4">
                  <label className="block font-mono text-xs uppercase tracking-wider text-ink-mute font-semibold mb-1.5 pl-0.5">
                    Direct Booking URL
                  </label>
                  <div className="flex items-center bg-cream-50 rounded-[0.875rem] border border-line p-1">
                    <div className="flex-1 px-3 py-2 bg-transparent font-mono text-xs text-ink truncate">
                      {displayHost}/clinic/{clinic.slug}
                    </div>
                    <button 
                      onClick={() => copyToClipboard(clinic.slug)}
                      className="bg-white hover:bg-cream-50 text-ink border border-line px-3.5 py-2 rounded-[0.625rem] font-bold text-xs transition-all active:scale-95 shadow-sm flex items-center gap-1.5"
                    >
                      {copiedSlug === clinic.slug ? (
                        <><Check className="w-3.5 h-3.5 text-teal-600" /> Copied</>
                      ) : (
                        <><Copy className="w-3.5 h-3.5 text-ink-mute" /> Copy</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </EdgeCard>
          ))}
        </div>
      )}
    </div>
  );
}
