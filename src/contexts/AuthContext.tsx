import type { AuthUser, UserProfile } from "@/types/user";
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import { LoadingScreen } from "@/components/ui/loading-screen";
import type { User } from "firebase/auth";
import i18n from "@/i18n";
import { saveLanguageToStorage } from "@/i18n";
import { toast } from "sonner";

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

    // Check if user profile exists and is not suspended
    const profile = await fetchUserProfile(userCredential.user.uid);

    if (!profile) {
      await signOut(auth);
      toast.error(i18n.t("auth.profileNotFound"));
      throw new Error("Profile not found");
    }

    if (profile.suspended) {
      await signOut(auth);
      toast.error(i18n.t("auth.accountSuspended"));
      throw new Error("Account suspended");
    }
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

        if (!profile) {
          setUserProfile(null);
          setAuthUser(null);
          setLoading(false);
          await signOut(auth);
          toast.error(i18n.t("auth.profileNotFound"));
          return;
        }

        if (profile.suspended) {
          setUserProfile(null);
          setAuthUser(null);
          setLoading(false);
          await signOut(auth);
          toast.error(i18n.t("auth.accountSuspended"));
          return;
        }

        setUserProfile(profile);

        setAuthUser({
          uid: user.uid,
          email: profile.email || user.email || "",
          profile: profile,
        });

        // Sync user's language preference to localStorage and i18n
        if (profile.language) {
          saveLanguageToStorage(profile.language);
          await i18n.changeLanguage(profile.language);
        }
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
      {loading ? (
        <LoadingScreen text={i18n.t("loading.authenticating")} />
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}
