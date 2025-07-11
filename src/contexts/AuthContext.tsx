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
import {
  isEmailAllowed,
  updateEmailStatusToRegistered,
} from "@/lib/allowed-emails-service";

import { LoadingScreen } from "@/components/ui/loading-screen";
import type { User } from "firebase/auth";
import { completeEmailUpdate, acceptTermsAndConditions } from "@/lib/profile-service";
import { saveLanguageToStorage } from "@/i18n";
import { toast } from "sonner";
import { LicenseDialog } from "@/components/ui/license-dialog";

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
  refreshProfile: () => Promise<void>;
  needsLicenseAcceptance: boolean;
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
  const [needsLicenseAcceptance, setNeedsLicenseAcceptance] = useState(false);
  const [showLicenseDialog, setShowLicenseDialog] = useState(false);

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
      setCurrentUser({ ...currentUser });
    } catch (error) {
      console.error("Error refreshing user:", error);
    }
  }

  async function refreshProfile() {
    if (!currentUser) return;

    try {
      const profile = await fetchUserProfile(currentUser.uid);
      if (profile && !profile.suspended) {
        setUserProfile(profile);
        setIsProfileComplete(!!(profile.name && profile.phone));
        
        // Check if admin user needs to accept license
        const needsAcceptance = profile.role === "admin" && !profile.acceptedTac;
        setNeedsLicenseAcceptance(needsAcceptance);
        setShowLicenseDialog(needsAcceptance);
        
        setAuthUser({
          uid: currentUser.uid,
          email: profile.email || currentUser.email || "",
          profile: profile,
        });
      }
    } catch (error) {
      console.error("Error refreshing profile:", error);
    }
  }

  async function handleLicenseAcceptance() {
    if (!currentUser) return;

    try {
      await acceptTermsAndConditions(currentUser.uid);
      setNeedsLicenseAcceptance(false);
      setShowLicenseDialog(false);
      
      // Refresh profile to get updated acceptedTac field
      await refreshProfile();
      
      toast.success(i18n.t("licenseDialog.acceptanceSuccess"));
    } catch (error) {
      console.error("Error accepting license:", error);
      toast.error(i18n.t("licenseDialog.acceptanceError"));
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

        // Check if email was updated and sync with Firestore
        let currentProfile = profile;
        if (profile.email !== user.email && user.email) {
          try {
            await completeEmailUpdate(user.uid, user.email);
            // Refetch profile with updated email
            const updatedProfile = await fetchUserProfile(user.uid);
            if (updatedProfile) {
              currentProfile = updatedProfile;
            }
          } catch (error) {
            console.error("Error syncing email update:", error);
          }
        }

        setUserProfile(currentProfile);

        // Check if profile is complete (name and phone exist)
        setIsProfileComplete(!!(currentProfile.name && currentProfile.phone));

        // Check if admin user needs to accept license
        const needsAcceptance = currentProfile.role === "admin" && !currentProfile.acceptedTac;
        setNeedsLicenseAcceptance(needsAcceptance);
        setShowLicenseDialog(needsAcceptance);

        setAuthUser({
          uid: user.uid,
          email: currentProfile.email || user.email || "",
          profile: currentProfile,
        });

        // Sync user's language preference to localStorage and i18n
        if (currentProfile.language) {
          saveLanguageToStorage(currentProfile.language);
          await i18n.changeLanguage(currentProfile.language);
        }
      } else {
        setUserProfile(null);
        setAuthUser(null);
        setIsEmailVerified(false);
        setIsProfileComplete(false);
        setNeedsLicenseAcceptance(false);
        setShowLicenseDialog(false);
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
    refreshProfile,
    needsLicenseAcceptance,
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <LoadingScreen text={i18n.t("loading.authenticating")} />
      ) : (
        <>
          {children}
          <LicenseDialog 
            open={showLicenseDialog} 
            onAccept={handleLicenseAcceptance}
          />
        </>
      )}
    </AuthContext.Provider>
  );
}
