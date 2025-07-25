import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import {
  QueryConstraint,
  collection,
  doc,
  endBefore,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  updateDoc,
  where,
  writeBatch
} from 'firebase/firestore';

import type { UserProfile } from '@/types/user';
import { db } from './firebase';
import { prepareSearchTerms } from './search-utils';

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

export interface UsersResponse {
  users: UserProfileWithId[];
  pagination: PaginationState;
}

export interface UserProfileWithId extends UserProfile {
  id: string;
}

export interface UsersQueryParams {
  pageSize?: number;
  pageIndex?: number;
  cursor?: PaginationCursor;
  searchTerm?: string;
  role?: string;
  suspended?: boolean;
  orderBy?: 'name' | 'email' | 'updatedAt';
  orderDirection?: 'asc' | 'desc';
}

export interface UsersFilterParams {
  searchTerm?: string;
  role?: string;
  suspended?: boolean;
  orderBy?: 'name' | 'email' | 'updatedAt';
  orderDirection?: 'asc' | 'desc';
}

// Helper function to build query constraints
function buildUsersQueryConstraints(params: UsersQueryParams): QueryConstraint[] {
  const constraints: QueryConstraint[] = [];

  // Add search constraints using array-contains-any
  if (params.searchTerm?.trim()) {
    const searchTerms = prepareSearchTerms(params.searchTerm);
    if (searchTerms.length > 0) {
      constraints.push(
        where('searchKeywords', 'array-contains-any', searchTerms)
      );
    }
  }

  // Add role filter
  if (params.role) {
    constraints.push(where('role', '==', params.role));
  }

  // Add suspended filter
  if (params.suspended !== undefined) {
    constraints.push(where('suspended', '==', params.suspended));
  }

  // Add ordering
  const orderField = params.orderBy || 'updatedAt';
  const orderDir = params.orderDirection || 'desc';
  constraints.push(orderBy(orderField, orderDir));

  return constraints;
}

// Helper function to build filter constraints for count queries
function buildUsersFilterConstraints(params: UsersFilterParams): QueryConstraint[] {
  const constraints: QueryConstraint[] = [];

  // Add search constraints using array-contains-any
  if (params.searchTerm?.trim()) {
    const searchTerms = prepareSearchTerms(params.searchTerm);
    if (searchTerms.length > 0) {
      constraints.push(
        where('searchKeywords', 'array-contains-any', searchTerms)
      );
    }
  }

  // Add role filter
  if (params.role) {
    constraints.push(where('role', '==', params.role));
  }

  // Add suspended filter
  if (params.suspended !== undefined) {
    constraints.push(where('suspended', '==', params.suspended));
  }

  // Add ordering for consistent results
  const orderField = params.orderBy || 'updatedAt';
  const orderDir = params.orderDirection || 'desc';
  constraints.push(orderBy(orderField, orderDir));

  return constraints;
}

// Get total count with filters
export async function getUsersCount(params: UsersFilterParams): Promise<number> {
  try {
    const usersCollection = collection(db, 'users');
    const constraints = buildUsersFilterConstraints(params);
    
    const countQuery = query(usersCollection, ...constraints);
    const countSnapshot = await getCountFromServer(countQuery);
    
    return countSnapshot.data().count;
  } catch (error) {
    console.error('Error getting users count:', error);
    throw error;
  }
}

export async function fetchUsers(params: UsersQueryParams): Promise<UsersResponse> {
  try {
    const {
      pageSize = 25,
      pageIndex = 0,
      cursor,
    } = params;

    const usersCollection = collection(db, 'users');
    const constraints = buildUsersQueryConstraints(params);
    
    // Add cursor pagination
    if (cursor) {
      if (cursor.direction === 'forward') {
        constraints.push(startAfter(cursor.docSnapshot));
      } else {
        constraints.push(endBefore(cursor.docSnapshot));
      }
    }
    
    constraints.push(limit(pageSize + 1)); // Get one extra to check if there are more

    const q = query(usersCollection, ...constraints);
    const querySnapshot = await getDocs(q);
    
    const docs = querySnapshot.docs;
    const users: UserProfileWithId[] = [];
    
    // Process documents (exclude the extra one used for pagination check)
    docs.slice(0, pageSize).forEach((doc) => {
      const data = doc.data();
      users.push({
        id: doc.id,
        ...data as UserProfile,
        createdAt: data?.createdAt?.toDate() || new Date(),
        updatedAt: data?.updatedAt?.toDate() || new Date(),
      });
    });

    // Calculate pagination state
    const startCursor = docs.length > 0 ? docs[0] : undefined;
    const endCursor = docs.length > 0 ? docs[Math.min(pageSize - 1, docs.length - 1)] : undefined;

    return {
      users,
      pagination: {
        pageIndex,
        pageSize,
        startCursor,
        endCursor
      }
    };
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

// Alternative search function for email search
export async function searchUsersByEmail(email: string, params: Omit<UsersQueryParams, 'searchTerm'>): Promise<UsersResponse> {
  try {
    const emailLower = email.toLowerCase();
    
    // Use the main fetch function with email search constraints
    const usersCollection = collection(db, 'users');
    const constraints: QueryConstraint[] = [];
    
    // Add email search constraint
    constraints.push(
      where('email', '>=', emailLower),
      where('email', '<=', emailLower + '\uf8ff')
    );
    
    // Add other filters
    if (params.role) {
      constraints.push(where('role', '==', params.role));
    }
    if (params.suspended !== undefined) {
      constraints.push(where('suspended', '==', params.suspended));
    }
    
    // Add ordering
    constraints.push(orderBy('email', 'asc'));
    
    // Add cursor pagination
    if (params.cursor) {
      if (params.cursor.direction === 'forward') {
        constraints.push(startAfter(params.cursor.docSnapshot));
      } else {
        constraints.push(endBefore(params.cursor.docSnapshot));
      }
    }
    
    const pageSize = params.pageSize || 25;
    const pageIndex = params.pageIndex || 0;
    
    constraints.push(limit(pageSize + 1));

    const q = query(usersCollection, ...constraints);
    const querySnapshot = await getDocs(q);
    const docs = querySnapshot.docs;
    
    const users: UserProfileWithId[] = [];
    docs.slice(0, pageSize).forEach((doc) => {
      users.push({
        id: doc.id,
        ...doc.data() as UserProfile
      });
    });

    // Calculate pagination state
    const startCursor = docs.length > 0 ? docs[0] : undefined;
    const endCursor = docs.length > 0 ? docs[Math.min(pageSize - 1, docs.length - 1)] : undefined;

    return {
      users,
      pagination: {
        pageIndex,
        pageSize,
        startCursor,
        endCursor
      }
    };
  } catch (error) {
    console.error('Error searching users by email:', error);
    throw error;
  }
}

// Combined search function that searches both name and email
export async function searchUsers(searchTerm: string, params: Omit<UsersQueryParams, 'searchTerm'>): Promise<UsersResponse> {
  if (!searchTerm.trim()) {
    return fetchUsers(params);
  }

  // For search, we use the main fetchUsers function with the searchTerm
  return fetchUsers({ ...params, searchTerm });
}

// New function to fetch multiple users by their IDs
export async function fetchUsersByIds(userIds: string[]): Promise<UserProfileWithId[]> {
  try {
    if (userIds.length === 0) {
      return [];
    }

    // Firestore 'in' queries are limited to 10 items, so we need to batch them
    const batches: Promise<UserProfileWithId[]>[] = [];
    const batchSize = 10;
    
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batchIds = userIds.slice(i, i + batchSize);
      
      const batchPromise = (async () => {
        const usersCollection = collection(db, 'users');
        const q = query(usersCollection, where('__name__', 'in', batchIds));
        const querySnapshot = await getDocs(q);
        
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data() as UserProfile
        }));
      })();
      
      batches.push(batchPromise);
    }
    
    const batchResults = await Promise.all(batches);
    return batchResults.flat();
  } catch (error) {
    console.error('Error fetching users by IDs:', error);
    throw error;
  }
}

// Function to fetch a single user by ID
export async function fetchUserById(userId: string): Promise<UserProfileWithId | null> {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      return null;
    }
    
    return {
      id: userDoc.id,
      ...userDoc.data() as UserProfile
    };
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    throw error;
  }
}

// Function to suspend a user account
export async function suspendUser(userId: string): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      suspended: true,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error suspending user:', error);
    throw error;
  }
}

// Function to unsuspend a user account
export async function unsuspendUser(userId: string): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      suspended: false,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error unsuspending user:', error);
    throw error;
  }
}

// Function to toggle user suspension status
export async function toggleUserSuspension(userId: string, currentStatus: boolean): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      suspended: !currentStatus,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error toggling user suspension:', error);
    throw error;
  }
}

// Check for existing users by email addresses
export async function getUsersByEmails(emails: string[]): Promise<string[]> {
  try {
    if (emails.length === 0) return [];
    
    const usersCollection = collection(db, 'users');
    const existingEmails: string[] = [];
    
    // Check each email individually since Firestore doesn't support 'in' queries with more than 10 values
    // and we want to be safe with the limit
    const batchSize = 10;
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      const emailQuery = query(usersCollection, where('email', 'in', batch));
      const querySnapshot = await getDocs(emailQuery);
      
      querySnapshot.docs.forEach((doc) => {
        const userData = doc.data() as UserProfile;
        if (userData.email) {
          existingEmails.push(userData.email.toLowerCase());
        }
      });
    }
    
    return existingEmails;
  } catch (error) {
    console.error('Error checking existing users by emails:', error);
    throw error;
  }
} 

// Bulk operations for users
export async function bulkUpdateUserStatus(
  userIds: string[],
  suspended: boolean
): Promise<{ successCount: number; errorCount: number; errors: string[] }> {
  try {
    const batchSize = 500; // Firestore batch limit
    const batches = [];
    const errors: string[] = [];
    let successCount = 0;
    let errorCount = 0;

    // Process users in batches
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchIds = userIds.slice(i, i + batchSize);
      
      batchIds.forEach((userId) => {
        const userDoc = doc(db, 'users', userId);
        batch.update(userDoc, {
          suspended,
          updatedAt: new Date()
        });
      });
      
      batches.push({ batch, batchIds });
    }

    // Execute all batches
    for (const { batch, batchIds } of batches) {
      try {
        await batch.commit();
        successCount += batchIds.length;
      } catch (error) {
        errorCount += batchIds.length;
        errors.push(`Failed to update batch: ${(error as Error).message}`);
        console.error('Error in batch update:', error);
      }
    }

    return { successCount, errorCount, errors };
  } catch (error) {
    console.error('Error in bulk status update:', error);
    throw error;
  }
}

export async function bulkUpdateUserRole(
  userIds: string[],
  role: string
): Promise<{ successCount: number; errorCount: number; errors: string[] }> {
  try {
    const batchSize = 500; // Firestore batch limit
    const batches = [];
    const errors: string[] = [];
    let successCount = 0;
    let errorCount = 0;

    // Process users in batches
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchIds = userIds.slice(i, i + batchSize);
      
      batchIds.forEach((userId) => {
        const userDoc = doc(db, 'users', userId);
        batch.update(userDoc, {
          role,
          updatedAt: new Date()
        });
      });
      
      batches.push({ batch, batchIds });
    }

    // Execute all batches
    for (const { batch, batchIds } of batches) {
      try {
        await batch.commit();
        successCount += batchIds.length;
      } catch (error) {
        errorCount += batchIds.length;
        errors.push(`Failed to update batch: ${(error as Error).message}`);
        console.error('Error in batch update:', error);
      }
    }

    return { successCount, errorCount, errors };
  } catch (error) {
    console.error('Error in bulk role update:', error);
    throw error;
  }
} 