import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  startAfter, 
  getDocs, 
  where,
  QueryConstraint,
  doc,
  updateDoc,
  getDoc
} from 'firebase/firestore';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { db } from './firebase';
import type { UserProfile } from '@/types/user';

export interface UsersResponse {
  users: UserProfileWithId[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
  total?: number;
}

export interface UserProfileWithId extends UserProfile {
  id: string;
}

export interface UsersQueryParams {
  pageSize?: number;
  lastDoc?: QueryDocumentSnapshot<DocumentData> | null;
  searchTerm?: string;
}

export async function fetchUsers({
  pageSize = 10,
  lastDoc = null,
  searchTerm = ''
}: UsersQueryParams): Promise<UsersResponse> {
  try {
    const usersCollection = collection(db, 'users');
    const constraints: QueryConstraint[] = [];

    // Add search constraints if searchTerm is provided
    if (searchTerm.trim()) {
      // For simple search, we'll search by name and email
      // Note: Firestore doesn't support full-text search, so we use startsWith
      const searchLower = searchTerm.toLowerCase();
      constraints.push(
        where('name', '>=', searchLower),
        where('name', '<=', searchLower + '\uf8ff')
      );
    }

    // Add ordering
    constraints.push(orderBy('name'));
    
    // Add pagination
    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }
    
    constraints.push(limit(pageSize + 1)); // Get one extra to check if there are more

    const q = query(usersCollection, ...constraints);
    const querySnapshot = await getDocs(q);
    
    const users: UserProfileWithId[] = [];
    const docs = querySnapshot.docs;
    
    // Process documents
    docs.slice(0, pageSize).forEach((doc) => {
      users.push({
        id: doc.id,
        ...doc.data() as UserProfile
      });
    });

    // Check if there are more documents
    const hasMore = docs.length > pageSize;
    const newLastDoc = docs.length > 0 ? docs[Math.min(pageSize - 1, docs.length - 1)] : null;

    return {
      users,
      lastDoc: newLastDoc,
      hasMore
    };
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

// Alternative search function for email search
export async function searchUsersByEmail(email: string, pageSize = 10): Promise<UsersResponse> {
  try {
    const usersCollection = collection(db, 'users');
    const emailLower = email.toLowerCase();
    
    const q = query(
      usersCollection,
      where('email', '>=', emailLower),
      where('email', '<=', emailLower + '\uf8ff'),
      orderBy('email'),
      limit(pageSize + 1)
    );

    const querySnapshot = await getDocs(q);
    const docs = querySnapshot.docs;
    
    const users: UserProfileWithId[] = [];
    docs.slice(0, pageSize).forEach((doc) => {
      users.push({
        id: doc.id,
        ...doc.data() as UserProfile
      });
    });

    const hasMore = docs.length > pageSize;
    const lastDoc = docs.length > 0 ? docs[Math.min(pageSize - 1, docs.length - 1)] : null;

    return {
      users,
      lastDoc,
      hasMore
    };
  } catch (error) {
    console.error('Error searching users by email:', error);
    throw error;
  }
}

// Combined search function that searches both name and email
export async function searchUsers(searchTerm: string, pageSize = 10): Promise<UsersResponse> {
  if (!searchTerm.trim()) {
    return fetchUsers({ pageSize });
  }

  try {
    // Search by name
    const nameResults = await fetchUsers({ 
      pageSize: Math.ceil(pageSize / 2), 
      searchTerm 
    });
    
    // Search by email
    const emailResults = await searchUsersByEmail(searchTerm, Math.ceil(pageSize / 2));
    
    // Combine and deduplicate results
    const combinedUsers = [...nameResults.users];
    emailResults.users.forEach(user => {
      if (!combinedUsers.some(existing => existing.id === user.id)) {
        combinedUsers.push(user);
      }
    });

    // Sort combined results by name
    combinedUsers.sort((a, b) => a.name.localeCompare(b.name));
    
    // Limit to requested page size
    const users = combinedUsers.slice(0, pageSize);
    
    return {
      users,
      lastDoc: null, // For search, we don't use pagination
      hasMore: combinedUsers.length > pageSize
    };
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
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
      suspended: true
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
      suspended: false
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
      suspended: !currentStatus
    });
  } catch (error) {
    console.error('Error toggling user suspension:', error);
    throw error;
  }
} 