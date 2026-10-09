import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/auth';
import { Copy, Check, QrCode, ExternalLink } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function DoctorProfileLinks() {
  const { user, userData } = useAuth();
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedSlug, setCopiedSlug] = useState(null);

  useEffect(() => {
    async function loadClinics() {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'clinics'),
          where('doctorId', '==', user.uid)
        );
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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

  if (loading) return <div className="text-gray-500 font-medium font-sans flex items-center gap-2 p-4">Loading profile links...</div>;

  const baseUrl = window.location.origin;
  const displayHost = window.location.host;

  return (
    <div className="pb-10 font-sans">
       <div className="mb-8">
         <h1 className="text-3xl font-display font-black text-premium-900 tracking-tight leading-tight">Profile Links</h1>
         <p className="text-gray-500 font-medium mt-2">Share these links or QR codes with medical representatives.</p>
       </div>

       {clinics.length === 0 ? (
          <div className="text-center py-16 text-gray-400 font-medium bg-white rounded-[1.5rem] border border-gray-100 border-dashed text-[15px]">
            You haven't set up any clinics yet. Go to Clinics to add one.
          </div>
       ) : (
          <div className="space-y-6">
            {clinics.map(clinic => (
              <div key={clinic.id} className="bg-white rounded-[1.5rem] shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-gray-100 p-8 flex flex-col md:flex-row items-center gap-8 group hover:shadow-[0_8px_30px_rgb(0,0,0,0.05)] transition-all">
                <div className="flex-shrink-0 bg-white p-4 rounded-[1.5rem] border border-gray-100 shadow-sm relative overflow-hidden group-hover:border-emerald-100 transition-colors">
                  <QRCodeSVG 
                    value={`${baseUrl}/clinic/${clinic.slug}`} 
                    size={160}
                    level="H"
                    includeMargin={false}
                    className="w-40 h-40"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>
                
                <div className="flex-1 flex flex-col justify-center min-w-0 w-full text-center md:text-left">
                  <div className="mb-2">
                     <h2 className="text-2xl font-display font-black text-premium-900 truncate">{clinic.name}</h2>
                     <p className="font-medium text-gray-500 mt-2 text-[15px]">{clinic.address}</p>
                  </div>
                  
                  <div className="mt-8">
                     <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 pl-1">Booking Link</label>
                     <div className="flex bg-premium-50 rounded-[1.25rem] border border-gray-100 p-1.5 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
                       <div className="flex-1 px-4 py-3 bg-transparent border-none outline-none text-premium-900 font-medium truncate flex items-center text-[15px]">
                        {displayHost}/clinic/{clinic.slug}
                      </div>
                      <button 
                        onClick={() => copyToClipboard(clinic.slug)}
                        className="bg-white hover:bg-gray-50 text-premium-900 border border-gray-200 px-5 py-3 rounded-[1rem] font-bold text-[14px] transition-all active:scale-95 shadow-sm flex items-center gap-2"
                      >
                        {copiedSlug === clinic.slug ? (
                          <><Check className="w-4 h-4 text-emerald-600" /> Copied</>
                        ) : (
                          <><Copy className="w-4 h-4 text-gray-400" /> Copy</>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
       )}
    </div>
  );
}
