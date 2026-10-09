import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDocs, collection, query, where, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/auth';
import { MapPin, Phone, Clock, ArrowRight, User } from 'lucide-react';

export default function ClinicPage() {
  const { clinicSlug } = useParams();
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  
  const [clinic, setClinic] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClinic() {
      try {
        const q = query(collection(db, 'clinics'), where('slug', '==', clinicSlug));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const clinicData = snap.docs[0].data();
          setClinic({ id: snap.docs[0].id, ...clinicData });
          
          if (clinicData.ownerDoctorId) {
            const drQuery = query(collection(db, 'doctors'), where('uid', '==', clinicData.ownerDoctorId));
            const drSnap = await getDocs(drQuery);
            if (!drSnap.empty) {
              const drData = drSnap.docs[0].data();
              // also get user doc to get the doctor's name
              const usrDoc = await getDoc(doc(db, 'users', clinicData.ownerDoctorId));
              if(usrDoc.exists()) {
                 setDoctor({ ...drData, name: usrDoc.data().name });
              } else {
                 setDoctor(drData);
              }
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchClinic();
  }, [clinicSlug]);

  if (loading) return <div className="min-h-screen bg-premium-50 flex items-center justify-center font-sans font-medium text-gray-500">Loading clinic details...</div>;

  if (!clinic) return (
    <div className="min-h-screen bg-premium-50 flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-16 h-16 bg-white rounded-[1.25rem] shadow-[0_2px_10px_rgb(0,0,0,0.02)] flex items-center justify-center text-gray-400 mb-6 border border-gray-100">
        <MapPin className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-display font-bold text-premium-900 mb-2">Clinic Not Found</h1>
      <p className="text-gray-500 font-medium mb-8 text-center max-w-sm">We couldn't find the clinic you're looking for. The link might be invalid.</p>
      <button onClick={() => navigate('/')} className="bg-white border border-gray-200 text-premium-900 font-bold px-6 py-3 rounded-[1rem] shadow-sm hover:bg-gray-50 transition-all active:scale-95">
        Go Home
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-premium-50 pb-20 font-sans">
      <div className="bg-white px-6 pt-12 pb-8 shadow-[0_4px_40px_rgb(0,0,0,0.03)] rounded-b-[2.5rem] border-b border-gray-100 relative overflow-hidden">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 rounded-[1.25rem] bg-premium-900 flex items-center justify-center text-white shadow-sm mb-6">
            <MapPin className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-display font-black text-premium-900 tracking-tight leading-tight">{clinic.clinicName}</h1>
          <p className="text-gray-500 font-medium mt-3 flex items-start gap-2">
            <MapPin className="w-4 h-4 mt-1 text-gray-400 flex-shrink-0" />
            <span className="text-[15px]">{clinic.address}, {clinic.city}</span>
          </p>
          {(clinic.phone || clinic.repHours) && (
            <div className="mt-8 flex flex-col gap-3">
              {clinic.phone && (
                <div className="flex items-center gap-3 text-[14px] font-bold text-premium-900 bg-premium-100 px-4 py-3 rounded-[1rem] border border-gray-100">
                  <Phone className="w-4 h-4 text-gray-500" /> {clinic.phone}
                </div>
              )}
              {clinic.repHours && (
                <div className="flex items-center gap-3 text-[14px] font-bold text-premium-900 bg-premium-100 px-4 py-3 rounded-[1rem] border border-gray-100">
                  <Clock className="w-4 h-4 text-gray-500" /> MR Hours: {clinic.repHours}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-md mx-auto p-6 mt-4">
        <h2 className="font-bold text-gray-400 mb-4 text-[11px] uppercase tracking-widest pl-2">Doctors Available</h2>
        
        {doctor ? (
          <div className="bg-white rounded-[1.5rem] p-6 shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-gray-100 group">
            <div className="flex items-center gap-5 mb-6">
              <div className="w-16 h-16 bg-premium-100 text-premium-900 rounded-[1.25rem] flex items-center justify-center font-bold text-2xl font-display">
                {doctor.name?.[0] || 'D'}
              </div>
              <div>
                <h3 className="font-bold text-premium-900 text-[18px] leading-tight mb-1">
                  Dr. {doctor?.privacy?.showFullName === false ? doctor.specialty : doctor.name}
                </h3>
                <p className="text-gray-500 font-medium text-[14px]">{doctor.specialty} • {doctor.qualifications}</p>
              </div>
            </div>
            
            <button 
              onClick={() => navigate(`/appointment/new?doctorId=${doctor.uid}&clinicId=${clinic.id}`)}
              className="w-full bg-premium-900 text-white font-bold rounded-[1.25rem] px-6 py-4 hover:bg-black transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(15,23,42,0.2)] text-[15px]"
            >
              Request Appointment <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="text-center py-10 bg-white rounded-[1.5rem] border border-gray-100 border-dashed text-gray-400 font-medium text-[15px]">
            No doctors found attached to this clinic.
          </div>
        )}
      </div>
    </div>
  );
}
