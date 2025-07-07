/**
 * User Management Service - Client-Side Implementation
 * 
 * IMPORTANT: This implementation uses Firebase Client SDK which has limitations:
 * - Creating users logs out the current admin (Firebase behavior)
 * - Can only send verification emails for current user
 * - Cannot update Firebase Auth email for other users
 * - Cannot access other users' Firebase Auth data
 * 
 * For production, use Firebase Admin SDK on a backend server.
 * See: src/lib/firebase-admin-limitations.md
 */

import { auth, db } from './firebase';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc
} from 'firebase/firestore';

import type { UserProfile } from '@/types/user';
import { generateUserSearchKeywords } from './search-utils';

export interface CreateUserData {
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'teacher';
  password: string;
}

export interface UpdateUserData {
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'teacher';
  suspended?: boolean;
}

export async function createUser(userData: CreateUserData): Promise<{ uid: string; requiresReauth: boolean }> {
  try {
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      userData.email, 
      userData.password
    );

    const newUser = userCredential.user;

    // Create user profile in Firestore
    const now = new Date();
    const userProfile: UserProfile = {
      name: userData.name,
      email: userData.email,
      phone: userData.phone || '',
      role: userData.role,
      suspended: false // New users are not suspended by default
    };

    // Generate search keywords for the user
    const searchKeywords = generateUserSearchKeywords(userProfile);
    
    const userProfileWithSearchKeywords = {
      ...userProfile,
      searchKeywords,
      createdAt: now,
      updatedAt: now
    };

    await setDoc(doc(db, 'users', newUser.uid), userProfileWithSearchKeywords);

    // Send email verification to new user
    await sendEmailVerification(newUser);

    // Return info about the created user and that re-auth is needed
    return { 
      uid: newUser.uid, 
      requiresReauth: true 
    };
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

export async function updateUser(
  userId: string, 
  userData: UpdateUserData,
): Promise<void> {
  try {
    // Get current user profile
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      throw new Error('User profile not found');
    }

    const currentProfile = userDoc.data() as UserProfile;

    // Update user profile in Firestore (email stays the same)
    const updatedProfile: UserProfile = {
      name: userData.name,
      email: currentProfile.email, // Keep existing email
      phone: userData.phone || '',
      role: userData.role,
      suspended: userData.suspended ?? currentProfile.suspended ?? false, // Use new suspended status or preserve existing
      language: currentProfile.language // Preserve existing language preference
    };

    // Generate search keywords for the updated user profile
    const searchKeywords = generateUserSearchKeywords(updatedProfile);
    
    const updatedProfileWithSearchKeywords = {
      ...updatedProfile,
      searchKeywords,
      updatedAt: new Date()
    };

    await updateDoc(userDocRef, updatedProfileWithSearchKeywords as Partial<UserProfile>);

  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}

export async function deleteUser(userId: string): Promise<void> {
  try {
    // Note: This only deletes the Firestore profile
    // Firebase Auth user deletion requires Admin SDK or the user to be signed in
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, { 
      deleted: true,
      deletedAt: new Date()
    });
    
    // TODO: Implement proper user deletion with Firebase Admin SDK
    // For now, we just mark the user as deleted
    throw new Error('User deletion is not fully implemented. Please contact an administrator.');
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

 