import {
  collection,
  doc,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  endBefore,
  getCountFromServer,
  type QueryDocumentSnapshot,
  type DocumentData,
  type QueryConstraint,
} from 'firebase/firestore';
import { db } from './firebase';
import type { AllowedEmail } from '@/types/user';

export interface AllowedEmailWithId extends AllowedEmail {
  id: string;
}

// Common pagination interfaces (matching other services)
export interface PaginationCursor {
  docSnapshot: QueryDocumentSnapshot<DocumentData>;
  direction: 'forward' | 'backward';
}

export interface PaginationState {
  pageIndex: number;
  pageSize: number;
  startCursor?: QueryDocumentSnapshot<DocumentData>;
  endCursor?: QueryDocumentSnapshot<DocumentData>;
}

export interface AllowedEmailsResponse {
  emails: AllowedEmailWithId[];
  pagination: PaginationState;
}

export interface AllowedEmailsQueryParams {
  pageSize?: number;
  pageIndex?: number;
  cursor?: PaginationCursor;
  orderBy?: 'email' | 'createdAt';
  orderDirection?: 'asc' | 'desc';
  status?: 'pending' | 'registered';
}

export interface AllowedEmailsFilterParams {
  orderBy?: 'email' | 'createdAt';
  orderDirection?: 'asc' | 'desc';
  status?: 'pending' | 'registered';
}

// Helper function to build query constraints
function buildAllowedEmailsQueryConstraints(params: AllowedEmailsQueryParams): QueryConstraint[] {
  const constraints: QueryConstraint[] = [];

  // Add status filter
  if (params.status) {
    constraints.push(where('status', '==', params.status));
  }

  // Add ordering
  const orderField = params.orderBy || 'updatedAt';
  const orderDir = params.orderDirection || 'desc';
  constraints.push(orderBy(orderField, orderDir));

  return constraints;
}

// Helper function to build filter constraints for count queries
function buildAllowedEmailsFilterConstraints(params: AllowedEmailsFilterParams): QueryConstraint[] {
  const constraints: QueryConstraint[] = [];

  // Add status filter
  if (params.status) {
    constraints.push(where('status', '==', params.status));
  }

  // Add ordering for consistent results
  const orderField = params.orderBy || 'updatedAt';
  const orderDir = params.orderDirection || 'desc';
  constraints.push(orderBy(orderField, orderDir));

  return constraints;
}

// Get total count
export async function getAllowedEmailsCount(params: AllowedEmailsFilterParams = {}): Promise<number> {
  try {
    const allowedEmailsCollection = collection(db, 'allowedEmails');
    const constraints = buildAllowedEmailsFilterConstraints(params);
    
    const countQuery = query(allowedEmailsCollection, ...constraints);
    const countSnapshot = await getCountFromServer(countQuery);
    
    return countSnapshot.data().count;
  } catch (error) {
    console.error('Error getting allowed emails count:', error);
    throw error;
  }
}

/**
 * Add an email to the allowed emails collection
 */
export async function addAllowedEmail(email: string, adminId: string): Promise<void> {
  try {
    const now = new Date();
    const allowedEmail = {
      email: email.toLowerCase().trim(),
      adminId,
      status: 'pending' as const,
    };

    await addDoc(collection(db, 'allowedEmails'), {
      ...allowedEmail,
      createdAt: now,
      updatedAt: now,
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
 * Update email status to registered after successful registration
 */
export async function updateEmailStatusToRegistered(email: string): Promise<void> {
  try {
    const q = query(
      collection(db, 'allowedEmails'),
      where('email', '==', email.toLowerCase().trim())
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const docToUpdate = querySnapshot.docs[0];
      await updateDoc(docToUpdate.ref, {
        status: 'registered',
        updatedAt: new Date()
      });
    }
  } catch (error) {
    console.error('Error updating email status to registered:', error);
    // Don't throw error here as this is cleanup and shouldn't block registration
  }
}

/**
 * Get all allowed emails with pagination
 */
export async function getAllowedEmails(params: AllowedEmailsQueryParams = {}): Promise<AllowedEmailsResponse> {
  try {
    const {
      pageSize = 25,
      pageIndex = 0,
      cursor,
    } = params;

    const allowedEmailsCollection = collection(db, 'allowedEmails');
    const constraints = buildAllowedEmailsQueryConstraints(params);
    
    // Add cursor pagination
    if (cursor) {
      if (cursor.direction === 'forward') {
        constraints.push(startAfter(cursor.docSnapshot));
      } else {
        constraints.push(endBefore(cursor.docSnapshot));
      }
    }
    
    constraints.push(limit(pageSize + 1)); // Get one extra to check if there are more

    const q = query(allowedEmailsCollection, ...constraints);
    const querySnapshot = await getDocs(q);
    
    const docs = querySnapshot.docs;
    const emails: AllowedEmailWithId[] = [];
    
    // Process documents (exclude the extra one used for pagination check)
    docs.slice(0, pageSize).forEach((doc) => {
      const data = doc.data();
      emails.push({
        id: doc.id,
        email: data.email,
        adminId: data.adminId,
        createdAt: data.createdAt?.toDate() || data.timestamp?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || data.timestamp?.toDate() || new Date(),
        status: data.status || 'pending', // Default to pending for backward compatibility
      });
    });

    // Calculate pagination state
    const startCursor = docs.length > 0 ? docs[0] : undefined;
    const endCursor = docs.length > 0 ? docs[Math.min(pageSize - 1, docs.length - 1)] : undefined;

    return {
      emails,
      pagination: {
        pageIndex,
        pageSize,
        startCursor,
        endCursor
      }
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
      where('email', '==', email.toLowerCase().trim()),
      where('status', '==', 'pending')
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