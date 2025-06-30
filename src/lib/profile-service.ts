import { 
  updateEmail as firebaseUpdateEmail, 
  updatePassword as firebaseUpdatePassword,
  updateProfile as firebaseUpdateProfile,
  reauthenticateWithCredential,
  EmailAuthProvider,
  type User
} from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { FirebaseError } from 'firebase/app';

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
    await updateDoc(userDocRef, {
      name: profileData.name,
      phone: profileData.phone,
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw new Error('Failed to update profile');
  }
}

/**
 * Update user email address (requires re-authentication)
 */
export async function updateUserEmail(user: User, updateData: UpdateEmailData): Promise<void> {
  try {
    // Re-authenticate user before sensitive operation
    const credential = EmailAuthProvider.credential(
      user.email || '', 
      updateData.currentPassword
    );
    await reauthenticateWithCredential(user, credential);

    // Update email in Firebase Auth
    await firebaseUpdateEmail(user, updateData.newEmail);

    // Update email in Firestore profile
    if (user.uid) {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        email: updateData.newEmail
      });
    }
  } catch (error) {
    console.error('Error updating email:', error);
    if ((error as FirebaseError).code === 'auth/wrong-password') {
      throw new Error('Current password is incorrect');
    } else if ((error as FirebaseError).code === 'auth/email-already-in-use') {
      throw new Error('This email is already in use by another account');
    } else if ((error as FirebaseError).code === 'auth/invalid-email') {
      throw new Error('Invalid email address');
    }
    throw new Error('Failed to update email address');
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