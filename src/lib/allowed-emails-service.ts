import {
  collection,
  doc,
  getDocs,
  addDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  type QueryDocumentSnapshot,
  type DocumentData,
} from 'firebase/firestore';
import { db } from './firebase';
import type { AllowedEmail } from '@/types/user';

export interface AllowedEmailWithId extends AllowedEmail {
  id: string;
}

export interface AllowedEmailsResponse {
  emails: AllowedEmailWithId[];
  pagination: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    endCursor?: QueryDocumentSnapshot<DocumentData>;
    startCursor?: QueryDocumentSnapshot<DocumentData>;
  };
}

/**
 * Add an email to the allowed emails collection
 */
export async function addAllowedEmail(email: string, adminId: string): Promise<void> {
  try {
    const allowedEmail: Omit<AllowedEmail, 'timestamp'> = {
      email: email.toLowerCase().trim(),
      adminId,
    };

    await addDoc(collection(db, 'allowedEmails'), {
      ...allowedEmail,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error adding allowed email:', error);
    throw new Error('Failed to add allowed email');
  }
}

/**
 * Remove an email from the allowed emails collection
 */
export async function removeAllowedEmail(emailId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'allowedEmails', emailId));
  } catch (error) {
    console.error('Error removing allowed email:', error);
    throw new Error('Failed to remove allowed email');
  }
}

/**
 * Get all allowed emails
 */
export async function getAllowedEmails(): Promise<AllowedEmailsResponse> {
  try {
    const q = query(
      collection(db, 'allowedEmails'),
      orderBy('timestamp', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const emails: AllowedEmailWithId[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      emails.push({
        id: doc.id,
        email: data.email,
        adminId: data.adminId,
        timestamp: data.timestamp.toDate(),
      });
    });

    return {
      emails,
      pagination: {
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
  } catch (error) {
    console.error('Error fetching allowed emails:', error);
    throw new Error('Failed to fetch allowed emails');
  }
}

/**
 * Check if an email is allowed for registration
 */
export async function isEmailAllowed(email: string): Promise<boolean> {
  try {
    const q = query(
      collection(db, 'allowedEmails'),
      where('email', '==', email.toLowerCase().trim())
    );
    
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking if email is allowed:', error);
    return false;
  }
}

/**
 * Remove email from allowed list after successful registration
 */
export async function deleteEmailAfterRegistration(email: string): Promise<void> {
  try {
    const q = query(
      collection(db, 'allowedEmails'),
      where('email', '==', email.toLowerCase().trim())
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const docToDelete = querySnapshot.docs[0];
      await deleteDoc(docToDelete.ref);
    }
  } catch (error) {
    console.error('Error removing email after registration:', error);
    // Don't throw error here as this is cleanup and shouldn't block registration
  }
} 