import type { AuthUser, UserProfile } from "@/types/user";
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import i18n, { LANGUAGE_STORAGE_KEY } from "@/i18n";

import { LoadingScreen } from "@/components/ui/loading-screen";
import type { User } from "firebase/auth";
import { saveLanguageToStorage } from "@/i18n";
import { toast } from "sonner";
import { isEmailAllowed, updateEmailStatusToRegistered } from "@/lib/allowed-emails-service";

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  authUser: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  hasRole: (role: "admin" | "teacher") => boolean;
  isEmailVerified: boolean;
  isProfileComplete: boolean;
  sendVerificationEmail: () => Promise<void>;
  refreshUser: () => Promise<void>;
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
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);

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

  async function register(email: string, password: string) {
    // First check if email is allowed
    const allowed = await isEmailAllowed(email);

    if (!allowed) {
      throw new Error("Email not allowed");
    }

    // Create user account
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Create user profile in Firestore
    const userProfile: UserProfile = {
      email: email,
      name: "",
      phone: "",
      role: "teacher",
      suspended: false,
      language:
        (localStorage.getItem(LANGUAGE_STORAGE_KEY)?.trim() as "en" | "th") ||
        "en",
    };

    await setDoc(doc(db, "users", userCredential.user.uid), userProfile);

    // Update email status to registered
    await updateEmailStatusToRegistered(email);

    // Send email verification
    await sendEmailVerification(userCredential.user);

    toast.success(i18n.t("auth.registrationSuccess"));
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

  async function sendVerificationEmail() {
    if (!currentUser) {
      throw new Error("No user logged in");
    }

    try {
      await sendEmailVerification(currentUser);
      toast.success("Verification email sent successfully!");
    } catch (error) {
      console.error("Error sending verification email:", error);
      toast.error("Failed to send verification email. Please try again.");
      throw error;
    }
  }

  async function refreshUser() {
    if (!currentUser) return;

    try {
      await reload(currentUser);
      // Update the current user state
      setCurrentUser({ ...currentUser });
    } catch (error) {
      console.error("Error refreshing user:", error);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      setCurrentUser(user);

      if (user) {
        // Set email verification status
        setIsEmailVerified(user.emailVerified);

        // Fetch user profile from Firestore
        const profile = await fetchUserProfile(user.uid);

        if (!profile) {
          setUserProfile(null);
          setAuthUser(null);
          setIsEmailVerified(false);
          setIsProfileComplete(false);
          setLoading(false);
          await signOut(auth);
          toast.error(i18n.t("auth.profileNotFound"));
          return;
        }

        if (profile.suspended) {
          setUserProfile(null);
          setAuthUser(null);
          setIsEmailVerified(false);
          setIsProfileComplete(false);
          setLoading(false);
          await signOut(auth);
          toast.error(i18n.t("auth.accountSuspended"));
          return;
        }

        setUserProfile(profile);

        // Check if profile is complete (name and phone exist)
        setIsProfileComplete(!!(profile.name && profile.phone));

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
        setIsEmailVerified(false);
        setIsProfileComplete(false);
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
    register,
    logout,
    loading,
    hasRole,
    isEmailVerified,
    isProfileComplete,
    sendVerificationEmail,
    refreshUser,
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
