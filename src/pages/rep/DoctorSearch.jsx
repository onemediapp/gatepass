import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listVisibleDoctors } from '../../lib/db/doctors';
import { getUser } from '../../lib/db/users';
import { Search, MapPin, SearchX, Filter, ArrowLeft, Clock, Activity, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { handleFirestoreError, OperationType } from '../../utils/firebaseErrors';
import { RepBottomNav } from '../../components/layout/RepBottomNav';

export default function DoctorSearch() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [filterCity, setFilterCity] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState('');

  const handleSearch = async () => {
    setIsSearching(true);
    setHasSearched(true);
    
    try {
      const docs = await listVisibleDoctors({
        city: filterCity || undefined,
        specialty: filterSpecialty || undefined
      });
      
      const searchLower = searchTerm.toLowerCase().trim();
      const filtered = docs.filter(d => {
         const nameMatch = d.name?.toLowerCase().includes(searchLower) || false;
         const specMatch = d.specialty?.toLowerCase().includes(searchLower) || false;
         const cityMatch = d.city?.toLowerCase().includes(searchLower) || false;
         return !searchLower || nameMatch || specMatch || cityMatch;
      });

      const enriched = await Promise.all(filtered.map(async (d) => {
         try {
           const uData = await getUser(d.id);
           const userName = uData?.name || d.name || 'Doctor';
           return { ...d, name: userName, photoUrl: uData?.photoUrl || d.photoUrl || null };
         } catch(e) { return d; }
      }));

      setResults(enriched.filter(Boolean));
    } catch (error) {
      console.error(error);
      handleFirestoreError(error, OperationType.LIST, 'doctors');
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => { handleSearch(); }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm, filterCity, filterSpecialty]);

  const getInitials = (name) => {
    if (!name) return 'DR';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen flex flex-col bg-premium-50 font-sans selection:bg-emerald-100">
      {/* iOS Style Header */}
      <div className="bg-white/80 backdrop-blur-2xl border-b border-gray-100 pt-safe sticky top-0 z-30 shadow-[0_4px_40px_rgb(0,0,0,0.03)]">
        <div className="px-5 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-[1rem] hover:bg-gray-50 transition-colors active:scale-95 text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={cn("p-2 -mr-2 rounded-[1rem] transition-colors active:scale-95", showFilters ? "text-emerald-600 bg-emerald-50" : "text-gray-500 hover:bg-gray-50")}
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>
        
        <div className="px-5 pb-4">
           <h1 className="text-3xl font-display font-black text-premium-900 mb-5 tracking-tight">Discover</h1>
           
           <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              className="w-full bg-premium-100 rounded-[1.25rem] pl-12 pr-4 py-3.5 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white focus:border-emerald-500 border border-transparent transition-all text-sm font-medium placeholder:text-gray-400 text-premium-900 shadow-sm"
              placeholder="Search by name, specialty, or city"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {/* Expandable Filters */}
        {showFilters && (
          <div className="px-5 pb-5 space-y-3 animate-in slide-in-from-top-2 fade-in">
             <div className="w-4 h-4 bg-white absolute top-[-6px] right-6 rotate-45 border-l border-t border-gray-100 hidden"></div>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Any City" 
                  className="w-full bg-white border border-gray-200 rounded-[1rem] pl-10 pr-3 py-3 text-sm font-medium outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-sm text-premium-900 placeholder:text-gray-400"
                  value={filterCity}
                  onChange={e => setFilterCity(e.target.value)}
                />
              </div>
              <div className="relative flex-1">
                <Activity className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                <select 
                  className="w-full bg-white border border-gray-200 rounded-[1rem] pl-10 pr-8 py-3 text-sm font-medium outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-sm text-premium-900 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%239CA3AF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:10px_10px] bg-no-repeat bg-[position:right_12px_center]"
                  value={filterSpecialty}
                  onChange={e => setFilterSpecialty(e.target.value)}
                >
                  <option value="">All Specialties</option>
                  <option value="General Physician">General Physician</option>
                  <option value="Cardiologist">Cardiologist</option>
                  <option value="Diabetologist">Diabetologist</option>
                  <option value="Orthopedic Surgeon">Orthopedic Surgeon</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 px-5 py-6 max-w-md w-full mx-auto pb-24">
        {!hasSearched ? (
          <div className="mt-20 text-center animate-in fade-in zoom-in duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
            <div className="w-20 h-20 bg-white border border-gray-100 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-sm">
              <div className="w-16 h-16 bg-emerald-50 rounded-[1.5rem] flex items-center justify-center border border-emerald-100">
                 <Search className="w-8 h-8 text-emerald-600" />
              </div>
            </div>
            <h2 className="text-[1.75rem] font-display font-black text-premium-900 mb-3 tracking-tight leading-tight">Find Specialists</h2>
            <p className="text-gray-500 max-w-[250px] mx-auto text-sm font-medium leading-relaxed">Search the GATEPASS network to find your target prescribers.</p>
          </div>
        ) : isSearching ? (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="animate-pulse flex gap-5 bg-white p-5 rounded-[1.5rem] border border-gray-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
                <div className="w-16 h-16 bg-gray-100 rounded-[1.25rem] flex-shrink-0"></div>
                <div className="space-y-3 flex-1 py-1">
                  <div className="w-3/4 h-5 bg-gray-100 rounded mt-1"></div>
                  <div className="w-1/2 h-3 bg-gray-100 rounded"></div>
                  <div className="w-1/3 h-3 bg-gray-100 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
           <div className="mt-20 text-center animate-in fade-in slide-in-from-bottom-4 duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
             <div className="w-20 h-20 bg-white border border-gray-100 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-sm">
               <div className="w-16 h-16 bg-gray-50 rounded-[1.5rem] flex items-center justify-center border border-gray-100">
                 <SearchX className="w-8 h-8 text-gray-400" />
               </div>
             </div>
             <h2 className="text-[1.5rem] font-display font-black text-premium-900 mb-2">No doctors found</h2>
             <p className="text-gray-500 text-sm font-medium">Try adjusting your filters or search terms.</p>
           </div>
        ) : (
          <div className="space-y-4">
             {results.map(doctor => {
                const displayName = doctor.privacy?.showFullName ? doctor.name : 'Dr. (Name Hidden)';
                return (
                  <div 
                    key={doctor.id} 
                    onClick={() => navigate(`/doctor/${doctor.id}`)}
                    className="bg-white rounded-[1.5rem] p-5 border border-gray-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.05)] hover:border-gray-200 transition-all cursor-pointer flex flex-col gap-4 group active:scale-[0.98]"
                  >
                    <div className="flex gap-4">
                      {/* Avatar */}
                      <div className="relative">
                        <div className="w-16 h-16 rounded-[1.25rem] bg-premium-100 text-premium-900 flex-shrink-0 flex items-center justify-center font-bold text-xl overflow-hidden shadow-sm border border-gray-100 font-display">
                          {doctor.photoUrl && doctor.privacy?.showFullName ? (
                            <img src={doctor.photoUrl} alt="" className="w-full h-full object-cover" />
                          ) : getInitials(displayName)}
                        </div>
                        {doctor.privacy?.allowAppointmentRequest && (
                           <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-sm" title="Taking Appointments"></div>
                        )}
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0 pt-1">
                        <h3 className="font-display font-black text-premium-900 text-base truncate tracking-tight mb-1 group-hover:text-emerald-600 transition-colors">
                          {doctor.privacy?.showFullName ? `Dr. ${displayName}` : displayName}
                        </h3>
                        <p className="text-xs font-bold text-emerald-600 mb-2 flex items-center gap-1.5 truncate">
                          {doctor.privacy?.showSpecialty ? doctor.specialty : 'Specialist'} 
                          <span className="text-emerald-200 aspect-square w-1 h-1 rounded-full bg-emerald-300"></span>
                          <span className="text-gray-500 font-medium truncate">{doctor.qualifications}</span>
                        </p>
                        
                        <div className="flex items-center gap-4 mt-2 mb-1">
                          {doctor.privacy?.showCity && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium whitespace-nowrap bg-gray-50 px-2 py-1 rounded-[0.5rem] border border-gray-100">
                              <MapPin className="w-3.5 h-3.5 text-gray-400" />
                              {doctor.city}
                            </div>
                          )}
                          {doctor.privacy?.showRepHours && doctor.repHours && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium truncate bg-gray-50 px-2 py-1 rounded-[0.5rem] border border-gray-100">
                              <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                              <span className="truncate">{doctor.repHours}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-center pl-2">
                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-premium-900 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </div>
                )
             })}
          </div>
        )}
      </div>
      <RepBottomNav />
    </div>
  );
}
