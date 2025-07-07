import type { DocumentData, FieldValue, QueryDocumentSnapshot } from 'firebase/firestore';
import {
  QueryConstraint,
  Timestamp,
  addDoc,
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
  where
} from 'firebase/firestore';
import type { ReservationStatus, ReservationWithId } from '@/types/reservation';

import { db } from './firebase';

// Common pagination interfaces (matching cars service)
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

export interface ReservationsResponse {
  reservations: ReservationWithId[];
  pagination: PaginationState;
}

export interface ReservationsQueryParams {
  pageSize?: number;
  pageIndex?: number;
  cursor?: PaginationCursor;
  statusFilter?: ReservationStatus | 'all';
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  carId?: string;
  orderBy?: 'startDateTime' | 'endDateTime' | 'updatedAt';
  orderDirection?: 'asc' | 'desc';
}

export interface ReservationsFilterParams {
  statusFilter?: ReservationStatus | 'all';
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  carId?: string;
  orderBy?: 'startDateTime' | 'endDateTime' | 'updatedAt';
  orderDirection?: 'asc' | 'desc';
}

// Helper function to build query constraints
function buildReservationsQueryConstraints(params: ReservationsQueryParams): QueryConstraint[] {
  const constraints: QueryConstraint[] = [];

  // Add user filter if specified (for user-specific reservations)
  if (params.userId) {
    constraints.push(where('userRef', '==', doc(db, 'users', params.userId)));
  }

  // Add car filter if specified (for car-specific reservations)
  if (params.carId) {
    constraints.push(where('carRef', '==', doc(db, 'cars', params.carId)));
  }

  // Add status filter if specified
  if (params.statusFilter && params.statusFilter !== 'all') {
    constraints.push(where('status', '==', params.statusFilter));
  }

  // Add date range filter if specified
  if (params.startDate && params.endDate) {
    // Filter by date range: startDateTime >= startDate AND endDateTime <= endDate
    constraints.push(
      where('startDateTime', '>=', Timestamp.fromDate(params.startDate)),
      where('endDateTime', '<=', Timestamp.fromDate(params.endDate))
    );
  } else if (params.startDate) {
    // Filter by start date only: startDateTime >= startDate
    constraints.push(
      where('startDateTime', '>=', Timestamp.fromDate(params.startDate))
    );
  } else if (params.endDate) {
    // Filter by end date only: endDateTime <= endDate
    constraints.push(
      where('endDateTime', '<=', Timestamp.fromDate(params.endDate))
    );
  }

  // Add ordering
  const orderField = params.orderBy || 'updatedAt';
  const orderDir = params.orderDirection || 'desc';
  constraints.push(orderBy(orderField, orderDir));

  return constraints;
}

// Helper function to build filter constraints for count queries
function buildReservationsFilterConstraints(params: ReservationsFilterParams): QueryConstraint[] {
  const constraints: QueryConstraint[] = [];

  // Add user filter if specified (for user-specific reservations)
  if (params.userId) {
    constraints.push(where('userRef', '==', doc(db, 'users', params.userId)));
  }

  // Add car filter if specified (for car-specific reservations)
  if (params.carId) {
    constraints.push(where('carRef', '==', doc(db, 'cars', params.carId)));
  }

  // Add status filter if specified
  if (params.statusFilter && params.statusFilter !== 'all') {
    constraints.push(where('status', '==', params.statusFilter));
  }

  // Add date range filter if specified
  if (params.startDate && params.endDate) {
    // Filter by date range: startDateTime >= startDate AND endDateTime <= endDate
    constraints.push(
      where('startDateTime', '>=', Timestamp.fromDate(params.startDate)),
      where('endDateTime', '<=', Timestamp.fromDate(params.endDate))
    );
  } else if (params.startDate) {
    // Filter by start date only: startDateTime >= startDate
    constraints.push(
      where('startDateTime', '>=', Timestamp.fromDate(params.startDate))
    );
  } else if (params.endDate) {
    // Filter by end date only: endDateTime <= endDate
    constraints.push(
      where('endDateTime', '<=', Timestamp.fromDate(params.endDate))
    );
  }

  // Add ordering for consistent results
  const orderField = params.orderBy || 'updatedAt';
  const orderDir = params.orderDirection || 'desc';
  constraints.push(orderBy(orderField, orderDir));

  return constraints;
}

// Get total count with filters
export async function getReservationsCount(params: ReservationsFilterParams): Promise<number> {
  try {
    const reservationsCollection = collection(db, 'reservations');
    const constraints = buildReservationsFilterConstraints(params);
    
    const countQuery = query(reservationsCollection, ...constraints);
    const countSnapshot = await getCountFromServer(countQuery);
    
    return countSnapshot.data().count;
  } catch (error) {
    console.error('Error getting reservations count:', error);
    throw error;
  }
}

export async function fetchReservations(params: ReservationsQueryParams): Promise<ReservationsResponse> {
  try {
    const {
      pageSize = 25,
      pageIndex = 0,
      cursor,
    } = params;

    const reservationsCollection = collection(db, 'reservations');
    const constraints = buildReservationsQueryConstraints(params);
    
    // Add cursor pagination
    if (cursor) {
      if (cursor.direction === 'forward') {
        constraints.push(startAfter(cursor.docSnapshot));
      } else {
        constraints.push(endBefore(cursor.docSnapshot));
      }
    }
    
    constraints.push(limit(pageSize + 1)); // Get one extra to check if there are more

    const q = query(reservationsCollection, ...constraints);
    const querySnapshot = await getDocs(q);
    
    const docs = querySnapshot.docs;
    const reservations: ReservationWithId[] = [];
    
    // Process documents (exclude the extra one used for pagination check)
    docs.slice(0, pageSize).forEach((doc) => {
      const data = doc.data();
      reservations.push({
        id: doc.id,
        ...data,
        startDateTime: data.startDateTime.toDate(),
        endDateTime: data.endDateTime.toDate(),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as ReservationWithId);
    });

    // Calculate pagination state
    const startCursor = docs.length > 0 ? docs[0] : undefined;
    const endCursor = docs.length > 0 ? docs[Math.min(pageSize - 1, docs.length - 1)] : undefined;

    return {
      reservations,
      pagination: {
        pageIndex,
        pageSize,
        startCursor,
        endCursor
      }
    };
  } catch (error) {
    console.error('Error fetching reservations:', error);
    throw error;
  }
}

// New function specifically for fetching user reservations
export async function fetchUserReservations(params: ReservationsQueryParams & { userId: string }): Promise<ReservationsResponse> {
  return fetchReservations(params);
}

export async function updateReservationStatus(
  reservationId: string, 
  status: ReservationStatus
): Promise<void> {
  try {
    const reservationDoc = doc(db, 'reservations', reservationId);
    await updateDoc(reservationDoc, {
      status,
      updatedAt: Timestamp.fromDate(new Date())
    });
  } catch (error) {
    console.error('Error updating reservation status:', error);
    throw error;
  }
}

// New function to handle user cancellation requests
export async function requestCancellation(
  reservationId: string,
  autoCancelation: boolean
): Promise<{ status: ReservationStatus; message: string }> {
  try {
    const newStatus: ReservationStatus = autoCancelation 
      ? 'cancelled' 
      : 'cancellation_pending';
    
    const reservationDoc = doc(db, 'reservations', reservationId);
    await updateDoc(reservationDoc, {
      status: newStatus,
      updatedAt: Timestamp.fromDate(new Date())
    });

    return {
      status: newStatus,
      message: autoCancelation 
        ? 'Reservation cancelled successfully'
        : 'Cancellation request submitted for admin approval'
    };
  } catch (error) {
    console.error('Error requesting cancellation:', error);
    throw error;
  }
}

// Fetch a single reservation by ID
export async function fetchReservationById(reservationId: string): Promise<ReservationWithId> {
  try {
    const reservationDoc = doc(db, 'reservations', reservationId);
    const reservationSnap = await getDoc(reservationDoc);
    
    if (!reservationSnap.exists()) {
      throw new Error('Reservation not found');
    }
    
    const data = reservationSnap.data();
    return {
      id: reservationSnap.id,
      ...data,
      startDateTime: data.startDateTime.toDate(),
      endDateTime: data.endDateTime.toDate(),
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    } as ReservationWithId;
  } catch (error) {
    console.error('Error fetching reservation:', error);
    throw error;
  }
}

// Count active reservations for a user (reservations where endDateTime > now)
export async function countActiveUserReservations(userId: string): Promise<number> {
  try {
    const reservationsCollection = collection(db, 'reservations');
    const now = new Date();
    
    const q = query(
      reservationsCollection,
      where('userRef', '==', doc(db, 'users', userId)),
      where('endDateTime', '>', Timestamp.fromDate(now)),
      where('status', 'in', ['pending', 'confirmed'])
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('Error counting active reservations:', error);
    throw error;
  }
}

// Create a new reservation
export async function createReservation(reservationData: {
  userRef: string;
  carRef: string;
  startDateTime: Date;
  endDateTime: Date;
  driver?: string;
  comments?: string;
  autoReservation: boolean;
}): Promise<string> {
  try {
    const reservationsCollection = collection(db, 'reservations');
    const now = new Date();
    
    const reservation = {
      userRef: doc(db, 'users', reservationData.userRef),
      carRef: doc(db, 'cars', reservationData.carRef),
      startDateTime: Timestamp.fromDate(reservationData.startDateTime),
      endDateTime: Timestamp.fromDate(reservationData.endDateTime),
      status: reservationData.autoReservation ? 'confirmed' : 'pending' as ReservationStatus,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
      ...(reservationData.driver ? { driver: reservationData.driver } : {}),
      ...reservationData.comments ? { comments: reservationData.comments } : {},
    };

    const docRef = await addDoc(reservationsCollection, reservation);
    return docRef.id;
  } catch (error) {
    console.error('Error creating reservation:', error);
    throw error;
  }
}

// Update a reservation
export async function updateReservation(
  reservationId: string,
  updateData: {
    carRef?: string;
    status?: ReservationStatus;
    driver?: string;
    comments?: string;
  }
): Promise<void> {
  try {
    const reservationDoc = doc(db, 'reservations', reservationId);
    const updates: { [x: string]: FieldValue | Partial<unknown> | undefined; } = {
      updatedAt: Timestamp.fromDate(new Date())
    };

    if (updateData.carRef) {
      updates.carRef = doc(db, 'cars', updateData.carRef);
    }
    if (updateData.status !== undefined) {
      updates.status = updateData.status;
    }
    if (updateData.driver !== undefined) {
      updates.driver = updateData.driver;
    }
    if (updateData.comments !== undefined) {
      updates.comments = updateData.comments;
    }

    await updateDoc(reservationDoc, updates);
  } catch (error) {
    console.error('Error updating reservation:', error);
    throw error;
  }
} 