import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDoctor } from '../../lib/db/doctors';
import { getUser } from '../../lib/db/users';
import { getClinic } from '../../lib/db/clinics';
import { handleFirestoreError, OperationType } from '../../utils/firebaseErrors';
import { MapPin, Clock, Phone, MessageCircle, Calendar, ArrowLeft, ShieldCheck, Building2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function DoctorProfile() {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  
  const [doctor, setDoctor] = useState(null);
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDoctor() {
      try {
        const data = await getDoctor(doctorId);
        if (!data) {
          setDoctor(null);
          setLoading(false);
          return;
        }
        
        const uData = await getUser(doctorId);
        
        setDoctor({
           id: doctorId,
           ...data,
           name: uData?.name || data.name || 'Doctor',
           photoUrl: uData?.photoUrl || data.photoUrl || null
        });

        if (data.privacy?.showClinicName && data.clinicIds?.length > 0) {
           const clinicsData = [];
           for (const cid of data.clinicIds) {
             const cData = await getClinic(cid);
             if (cData) clinicsData.push(cData);
           }
           setClinics(clinicsData);
        }
        
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'doctors/' + doctorId);
      } finally {
        setLoading(false);
      }
    }
    fetchDoctor();
  }, [doctorId]);

  if (loading) {
     return <div className="min-h-screen bg-premium-50 flex items-center justify-center font-sans tracking-tight text-gray-500 font-medium">Loading profile...</div>;
  }

  if (!doctor) {
     return (
       <div className="min-h-screen bg-premium-50 flex flex-col items-center justify-center p-6 text-center">
         <div className="w-16 h-16 bg-white shadow-sm border border-gray-100 rounded-[1.25rem] flex items-center justify-center mb-4">
            <ShieldCheck className="w-8 h-8 text-gray-400" />
         </div>
         <h2 className="text-2xl font-display font-black text-premium-900">Profile Unavailable</h2>
         <p className="text-gray-500 mt-2 font-medium">This doctor could not be found.</p>
         <button onClick={() => navigate(-1)} className="mt-6 font-bold text-premium-900 px-6 py-3 bg-white border border-gray-200 rounded-[1rem] shadow-sm hover:bg-gray-50 active:scale-95 transition-all">Go Back</button>
       </div>
     );
  }

  const p = doctor.privacy || {};
  const displayName = p.showFullName ? doctor.name : 'Doctor';
  const getInitials = (name) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div className="min-h-screen font-sans selection:bg-emerald-100 bg-premium-50 pb-24">
      {/* Immersive Header Banner */}
      <div className="h-44 bg-premium-900 relative overflow-hidden">
        {/* Subtle glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-[80px]"></div>
        
         <button onClick={() => navigate(-1)} className="absolute top-safe-4 left-4 p-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-[1rem] transition-colors z-20 shadow-sm border border-white/10 mt-4 active:scale-95">
            <ArrowLeft className="w-5 h-5 text-white" />
         </button>
      </div>
      
      <div className="max-w-md mx-auto px-5 relative z-10 -mt-16 space-y-6">
        {/* Main Profile Card */}
        <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-[0_4px_40px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col items-center text-center">
          <div className="relative w-28 h-28 -mt-20 mb-4 z-20">
            <div className="absolute inset-0 bg-white rounded-[1.5rem] shadow-[0_4px_20px_rgb(0,0,0,0.06)] transform -rotate-3"></div>
            <div className="absolute inset-0 bg-white rounded-[1.5rem] p-1.5 shadow-sm transform rotate-3 transition-transform hover:rotate-0">
              <div className="w-full h-full bg-premium-100 rounded-[1.25rem] flex items-center justify-center text-premium-900 font-black text-3xl overflow-hidden font-display">
                  {doctor.photoUrl && p.showFullName ? (
                    <img src={doctor.photoUrl} alt="" className="w-full h-full object-cover" />
                  ) : getInitials(displayName)}
              </div>
            </div>
            {p.allowAppointmentRequest && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full shadow-sm z-30" title="Taking Appointments"></div>
            )}
          </div>
          
          <h1 className="text-3xl font-display font-black text-premium-900 tracking-tight leading-tight">
             {p.showFullName ? `Dr. ${displayName}` : displayName}
          </h1>
          <p className="text-emerald-600 font-bold mt-2 flex items-center justify-center gap-2">
             {p.showSpecialty ? doctor.specialty : 'Specialist'} 
             {doctor.qualifications && (
               <>
                 <span className="w-1 h-1 bg-emerald-200 rounded-full mx-0.5"></span>
                 <span className="text-gray-500 font-medium">{doctor.qualifications}</span>
               </>
             )}
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-3 mt-5 mb-2 text-[13px] text-gray-600 font-bold">
             {p.showCity && (
               <div className="flex items-center gap-1.5 bg-gray-50 px-3.5 py-2 rounded-[1rem] border border-gray-100"><MapPin className="w-4 h-4 text-gray-400" /> {doctor.city}{doctor.state ? `, ${doctor.state}` : ''}</div>
             )}
             {p.showRepHours && doctor.repHours && (
               <div className="flex items-center gap-1.5 bg-gray-50 px-3.5 py-2 rounded-[1rem] border border-gray-100"><Clock className="w-4 h-4 text-gray-400" /> {doctor.repHours}</div>
             )}
          </div>
          
          <div className="w-full mt-8">
            {p.allowAppointmentRequest ? (
               <button 
                 onClick={() => navigate(`/appointment/new?doctorId=${doctor.id}`)}
                 className="w-full bg-premium-900 hover:bg-black text-white font-bold rounded-[1.25rem] px-5 py-4 transition-all shadow-[0_4px_14px_rgba(15,23,42,0.2)] active:scale-[0.98] flex items-center justify-center gap-2 text-[15px]"
               >
                 <Calendar className="w-5 h-5" />
                 Request Meeting
               </button>
            ) : (
               <div className="w-full bg-gray-50 border border-gray-200 text-gray-500 font-bold rounded-[1.25rem] px-5 py-4 text-[14px] text-center">
                 Not taking rep requests currently
               </div>
            )}
          </div>
        </div>

        {/* Contact & Clinics Sections */}
        <div className="space-y-4">
          {(p.phoneVisibility !== 'hidden' || p.allowWhatsAppRedirect) && (
            <div className="bg-white rounded-[2rem] p-6 sm:p-7 shadow-[0_4px_30px_rgb(0,0,0,0.03)] border border-gray-100">
               <h3 className="font-display font-black text-premium-900 mb-5 tracking-tight text-[18px] flex items-center gap-2">
                 <Phone className="w-5 h-5 text-gray-400" /> Contact Info
               </h3>
               <div className="space-y-3">
                 {p.phoneVisibility === 'all_contacted' && doctor.whatsappNumber && (
                    <a href={`tel:+91${doctor.whatsappNumber}`} className="flex items-center gap-4 w-full bg-premium-50 rounded-[1.25rem] p-3 text-premium-900 font-bold hover:bg-gray-100 transition-colors active:scale-[0.98] border border-gray-100">
                      <div className="w-12 h-12 bg-white rounded-[1rem] flex items-center justify-center shadow-sm text-gray-500 border border-gray-100"><Phone className="w-5 h-5" /></div>
                      <div>
                        <div className="text-gray-400 text-[10px] uppercase tracking-widest mb-0.5">Phone Number</div>
                        +91 {doctor.whatsappNumber}
                      </div>
                    </a>
                 )}
                 {p.allowWhatsAppRedirect && doctor.whatsappNumber && (
                    <a href={`https://wa.me/91${doctor.whatsappNumber}`} target="_blank" rel="noreferrer" className="flex items-center gap-4 w-full bg-[#25D366]/10 rounded-[1.25rem] p-3 text-[#128C7E] font-bold hover:bg-[#25D366]/20 transition-colors active:scale-[0.98] border border-[#25D366]/20">
                      <div className="w-12 h-12 bg-white rounded-[1rem] flex items-center justify-center shadow-sm text-[#25D366] border border-[#25D366]/10"><MessageCircle className="w-5 h-5" /></div>
                      Open in WhatsApp
                    </a>
                 )}
                 {p.phoneVisibility === 'approved_only' && (
                    <div className="flex items-start gap-3 bg-amber-50 text-amber-900 p-5 rounded-[1.25rem] border border-amber-100">
                       <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-500" />
                       <p className="text-[14px] font-medium leading-relaxed">Phone number visible after your Gatepass request is approved.</p>
                    </div>
                 )}
               </div>
            </div>
          )}

          {p.showClinicName && clinics.length > 0 && (
            <div className="bg-white rounded-[2rem] p-6 sm:p-7 shadow-[0_4px_30px_rgb(0,0,0,0.03)] border border-gray-100">
               <h3 className="font-display font-black text-premium-900 mb-5 tracking-tight text-[18px] flex items-center gap-2">
                 <Building2 className="w-5 h-5 text-gray-400" /> Associated Clinics
               </h3>
               <div className="space-y-4">
                 {clinics.map(clinic => (
                   <div key={clinic.id} className="flex gap-4 items-start border-b border-gray-50 pb-5 last:border-0 last:pb-0">
                     <div className="bg-premium-100 p-3 rounded-[1rem] text-premium-900 shadow-sm flex-shrink-0 border border-gray-100"><MapPin className="w-5 h-5" /></div>
                     <div className="pt-1">
                       <h4 className="font-bold text-premium-900 text-[16px] mb-1 leading-tight">{clinic.clinicName}</h4>
                       <p className="text-[14px] text-gray-500 font-medium leading-relaxed">{clinic.address}</p>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
