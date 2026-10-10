import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getClinic } from '../../lib/db/clinics';
import { getDoctor } from '../../lib/db/doctors';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, ArrowLeft, ShieldCheck, MapPin } from 'lucide-react';
import Perforation from '../../components/ui/Perforation';
import Skeleton from '../../components/ui/Skeleton';
import MonoTag from '../../components/ui/MonoTag';

export default function ClinicPrintPoster() {
  const { clinicId } = useParams();
  const navigate = useNavigate();

  const [clinic, setClinic] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClinicAndDoctor() {
      if (!clinicId) return;
      try {
        const cData = await getClinic(clinicId);
        if (cData) {
          setClinic(cData);
          if (cData.ownerDoctorId) {
            const dData = await getDoctor(cData.ownerDoctorId);
            if (dData) setDoctor(dData);
          }
        }
      } catch (err) {
        console.error('Error fetching clinic for print:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchClinicAndDoctor();
  }, [clinicId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center p-6 space-y-4">
        <Skeleton className="w-16 h-16 rounded-[1rem]" />
        <Skeleton className="w-48 h-6 rounded-[0.5rem]" />
        <Skeleton className="w-72 h-80 rounded-[1.5rem]" />
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-display font-bold text-ink">Clinic Not Found</h2>
        <button
          onClick={() => navigate('/admin/clinics')}
          className="mt-4 px-4 py-2 bg-navy-900 text-white rounded-[0.875rem] text-xs font-semibold"
        >
          Return to Clinics
        </button>
      </div>
    );
  }

  const qrUrl = `${window.location.origin}/clinic/${clinic.slug}`;
  const doctorName = doctor?.name ? (doctor.name.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`) : 'Your Doctor';

  return (
    <div className="min-h-screen bg-cream-50 py-6 px-4 print:p-0 print:bg-white flex flex-col items-center">
      
      {/* Top action bar (hidden when printing) */}
      <div className="w-full max-w-[210mm] flex items-center justify-between mb-4 print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[0.75rem] bg-white border border-line text-xs font-semibold text-ink hover:bg-cream-50 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[0.875rem] bg-navy-900 hover:bg-navy-700 text-white text-xs font-bold transition-all shadow-md active:scale-[0.99]"
        >
          <Printer className="w-4 h-4 text-amber-500" /> Print A4 Poster
        </button>
      </div>

      {/* A4 Printable Poster Canvas */}
      <div className="w-full max-w-[210mm] min-h-[297mm] bg-white border border-line print:border-none shadow-lg print:shadow-none rounded-[1.75rem] print:rounded-none p-8 sm:p-12 flex flex-col justify-between text-ink relative overflow-hidden print:w-[210mm] print:h-[297mm]">
        
        {/* Top Header Motif */}
        <div>
          <div className="flex items-center justify-between pb-6 border-b border-line">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-3xl tracking-tight text-navy-900">
                Gatepass
              </span>
              <span className="w-3 h-3 rounded-[0.25rem] bg-amber-500 transform rotate-45 inline-block" />
            </div>

            <div className="text-right">
              <MonoTag variant="neutral" className="text-xs">
                Official Reception Notice
              </MonoTag>
              <p className="font-mono text-[0.625rem] text-ink-mute mt-0.5 uppercase tracking-wider">
                Zero Wait Detailing Protocol
              </p>
            </div>
          </div>

          {/* Headline & Doctor Name */}
          <div className="mt-8 text-center space-y-2">
            <span className="inline-block px-3 py-1 rounded-full bg-teal-50 border border-teal-600/30 text-teal-600 font-mono text-xs font-semibold tracking-wider uppercase mb-1">
              Pharma Medical Representatives
            </span>
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-navy-900 leading-tight">
              Book your slot with {doctorName}
            </h1>
            <p className="text-sm font-medium text-ink-soft">
              {doctor?.specialty && `${doctor.specialty} · `}{clinic.clinicName}
            </p>
          </div>
        </div>

        {/* Center QR Area */}
        <div className="my-8 flex flex-col items-center">
          <div className="p-6 bg-cream-50 rounded-[2rem] border-2 border-line shadow-inner flex flex-col items-center relative">
            {/* Top QR Label */}
            <span className="font-mono text-xs uppercase tracking-widest text-ink-mute font-semibold mb-4">
              Scan to Select a Time Slot
            </span>

            <div className="p-4 bg-white rounded-[1.25rem] border border-line shadow-md">
              <QRCodeSVG
                value={qrUrl}
                size={230}
                level="H"
                includeMargin={false}
                className="w-56 h-56"
              />
            </div>

            <p className="font-mono text-xs text-navy-500 mt-4 font-semibold tracking-tight">
              {window.location.host}/clinic/{clinic.slug}
            </p>
          </div>

          <p className="text-center text-xs text-ink-soft max-w-sm mt-4 font-medium leading-relaxed">
            Scan this QR code on your phone camera or QR reader to view available doctor hours and request your slot.
          </p>
        </div>

        {/* Perforation Divider */}
        <div className="w-full my-2">
          <Perforation bgClass="bg-white" className="my-0" />
        </div>

        {/* Boarding Pass Reception Callout */}
        <div className="space-y-4">
          <div className="bg-navy-900 text-white rounded-[1.25rem] p-5 text-center shadow-md">
            <div className="flex items-center justify-center gap-2 mb-1">
              <ShieldCheck className="w-5 h-5 text-teal-50" />
              <span className="font-display font-bold text-lg tracking-wide uppercase">
                Show your Gatepass at reception
              </span>
            </div>
            <p className="text-xs text-navy-100 max-w-md mx-auto leading-relaxed">
              When the doctor approves your requested visit, present your live Gatepass screen to reception for verified immediate entry.
            </p>
          </div>

          {/* Footer location info */}
          <div className="flex items-center justify-between text-xs text-ink-mute pt-3 border-t border-line">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-amber-500" />
              {clinic.address}, {clinic.city}
            </span>
            <span className="font-mono text-[0.625rem]">Gatepass Beta · Remedi Clinic</span>
          </div>
        </div>

      </div>

    </div>
  );
}
