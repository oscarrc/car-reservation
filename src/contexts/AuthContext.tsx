import type { AuthUser, UserProfile } from "@/types/user";
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import type { User } from "firebase/auth";

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  authUser: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  hasRole: (role: "admin" | "teacher") => boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userDocRef = doc(db, "users", uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const profileData = userDoc.data() as UserProfile;
        return profileData;
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  }

  async function login(email: string, password: string) {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    console.log("Login successful:", userCredential);
  }

  function logout() {
    return signOut(auth);
  }

  function hasRole(role: "admin" | "teacher"): boolean {
    if (!userProfile) return false;

    if (userProfile.role === "admin") {
      return true;
    }

    if (role === "teacher") {
      return userProfile.role === "teacher";
    }

    return false;
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      setCurrentUser(user);

      if (user) {
        // Fetch user profile from Firestore
        const profile = await fetchUserProfile(user.uid);
        setUserProfile(profile);

        setAuthUser({
          uid: user.uid,
          email: profile?.email || user.email || "",
          profile: profile || undefined,
        });
      } else {
        setUserProfile(null);
        setAuthUser(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    authUser,
    login,
    logout,
    loading,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
