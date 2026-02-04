import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/integrations/firebase/client";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isSeller: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSeller, setIsSeller] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        await Promise.all([
          fetchProfile(firebaseUser.uid),
          checkSellerStatus(firebaseUser.uid),
        ]);
      } else {
        setProfile(null);
        setIsSeller(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const profileRef = doc(db, "profiles", userId);
    const snapshot = await getDoc(profileRef);
    if (snapshot.exists()) {
      const data = snapshot.data();
      setProfile({
        id: snapshot.id,
        email: data.email ?? null,
        full_name: data.full_name ?? null,
        avatar_url: data.avatar_url ?? null,
        phone: data.phone ?? null,
      });
    }
  };

  const checkSellerStatus = async (userId: string) => {
    const sellerRef = doc(db, "sellers", userId);
    const snapshot = await getDoc(sellerRef);
    setIsSeller(snapshot.exists());
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setProfile(null);
    setIsSeller(false);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, isSeller }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
