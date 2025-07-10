import { 
  updatePassword as firebaseUpdatePassword,
  updateProfile as firebaseUpdateProfile,
  reauthenticateWithCredential,
  EmailAuthProvider,
  verifyBeforeUpdateEmail,
  type User
} from 'firebase/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { FirebaseError } from 'firebase/app';
import { generateUserSearchKeywords } from './search-utils';
import type { UserProfile } from '@/types/user';

export interface UpdateProfileData {
  name: string;
  phone: string;
}

export interface UpdateEmailData {
  currentPassword: string;
  newEmail: string;
}

export interface UpdatePasswordData {
  currentPassword: string;
  newPassword: string;
}

/**
 * Update user profile information in Firestore
 */
export async function updateUserProfile(uid: string, profileData: UpdateProfileData): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', uid);
    
    // Get current user data to merge with updates
    const currentUserDoc = await getDoc(userDocRef);
    if (currentUserDoc.exists()) {
      const currentUserData = currentUserDoc.data() as UserProfile;
      const mergedUserData = { 
        ...currentUserData, 
        name: profileData.name, 
        phone: profileData.phone 
      };
      
      // Generate new search keywords
      const searchKeywords = generateUserSearchKeywords(mergedUserData);
      
      await updateDoc(userDocRef, {
        name: profileData.name,
        phone: profileData.phone,
        searchKeywords,
        updatedAt: new Date()
      });
    } else {
      await updateDoc(userDocRef, {
        name: profileData.name,
        phone: profileData.phone,
        updatedAt: new Date()
      });
    }
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw new Error('Failed to update profile');
  }
}

/**
 * Update user email address (requires re-authentication and verification)
 */
export async function updateUserEmail(user: User, updateData: UpdateEmailData): Promise<void> {
  try {
    // Re-authenticate user before sensitive operation
    const credential = EmailAuthProvider.credential(
      user.email || '', 
      updateData.currentPassword
    );
    await reauthenticateWithCredential(user, credential);

    // Use Firebase's secure email update flow
    // This sends verification emails to both old and new email addresses
    await verifyBeforeUpdateEmail(user, updateData.newEmail);

    // Note: Firestore update will happen automatically when the user
    // verifies the new email through the verification process
    
  } catch (error) {
    console.error('Error updating email:', error);
    if ((error as FirebaseError).code === 'auth/wrong-password') {
      throw new Error('Current password is incorrect');
    } else if ((error as FirebaseError).code === 'auth/email-already-in-use') {
      throw new Error('This email is already in use by another account');
    } else if ((error as FirebaseError).code === 'auth/invalid-email') {
      throw new Error('Invalid email address');
    } else if ((error as FirebaseError).code === 'auth/operation-not-allowed') {
      throw new Error('Email change is currently disabled. Please contact support.');
    }
    throw new Error('Failed to update email address');
  }
}

/**
 * Complete email update in Firestore after verification
 * This should be called after the user verifies their new email
 */
export async function completeEmailUpdate(uid: string, newEmail: string): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', uid);
    
    // Get current user data to merge with updates
    const currentUserDoc = await getDoc(userDocRef);
    if (currentUserDoc.exists()) {
      const currentUserData = currentUserDoc.data() as UserProfile;
      const mergedUserData = { 
        ...currentUserData, 
        email: newEmail 
      };
      
      // Generate new search keywords
      const searchKeywords = generateUserSearchKeywords(mergedUserData);
      
      await updateDoc(userDocRef, {
        email: newEmail,
        searchKeywords,
        updatedAt: new Date()
      });
    } else {
      await updateDoc(userDocRef, {
        email: newEmail,
        updatedAt: new Date()
      });
    }
  } catch (error) {
    console.error('Error completing email update:', error);
    throw new Error('Failed to complete email update');
  }
}

/**
 * Update user password (requires re-authentication)
 */
export async function updateUserPassword(user: User, updateData: UpdatePasswordData): Promise<void> {
  try {
    // Re-authenticate user before sensitive operation
    const credential = EmailAuthProvider.credential(
      user.email || '', 
      updateData.currentPassword
    );
    await reauthenticateWithCredential(user, credential);

    // Update password in Firebase Auth
    await firebaseUpdatePassword(user, updateData.newPassword);
  } catch (error) {
    console.error('Error updating password:', error);
    if ((error as FirebaseError).code === 'auth/wrong-password') {
      throw new Error('Current password is incorrect');
    } else if ((error as FirebaseError).code === 'auth/weak-password') {
      throw new Error('New password is too weak');
    }
    throw new Error('Failed to update password');
  }
}

/**
 * Update Firebase Auth display name
 */
export async function updateDisplayName(user: User, displayName: string): Promise<void> {
  try {
    await firebaseUpdateProfile(user, { displayName });
  } catch (error) {
    console.error('Error updating display name:', error);
    throw new Error('Failed to update display name');
  }
}

/**
 * Accept terms and conditions - update acceptedTac timestamp
 */
export async function acceptTermsAndConditions(uid: string): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, {
      acceptedTac: new Date(),
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error accepting terms and conditions:', error);
    throw new Error('Failed to accept terms and conditions');
  }
} 