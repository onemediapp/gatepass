import { useEffect, useState, createContext, useContext } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

const AuthContext = createContext(null);

function SkeletonSplash() {
  return (
    <div className="min-h-screen bg-[#FAFAF7] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col items-center space-y-6">
        {/* Logo shimmer */}
        <div className="w-14 h-14 rounded-2xl bg-[#0B1730]/10 animate-pulse flex items-center justify-center">
          <div className="w-6 h-6 rounded-lg bg-[#0B1730]/20" />
        </div>

        {/* Text shimmer */}
        <div className="w-full space-y-3 flex flex-col items-center">
          <div className="h-5 w-32 bg-[#0B1730]/10 rounded-full animate-pulse" />
          <div className="h-3 w-48 bg-[#0B1730]/10 rounded-full animate-pulse" />
        </div>

        {/* Card skeleton */}
        <div className="w-full h-32 rounded-3xl bg-white border border-[#E8E6DF] p-5 space-y-3 shadow-sm animate-pulse">
          <div className="h-4 w-3/4 bg-[#0B1730]/10 rounded-lg" />
          <div className="h-3 w-1/2 bg-[#0B1730]/10 rounded-lg" />
          <div className="h-3 w-5/6 bg-[#0B1730]/10 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setUserData(userDocSnap.data());
          } else {
            setUserData(null);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUserData(null);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = {
    user,
    userData,
    loading,
    setUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? <SkeletonSplash /> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
