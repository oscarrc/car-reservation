import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import {
  QueryConstraint,
  Timestamp,
  addDoc,
  collection,
  doc,
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

export interface ReservationsResponse {
  reservations: ReservationWithId[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
  total?: number;
}

export interface ReservationsQueryParams {
  pageSize?: number;
  lastDoc?: QueryDocumentSnapshot<DocumentData> | null;
  statusFilter?: ReservationStatus | 'all';
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  carId?: string;
}

export async function fetchReservations({
  pageSize = 10,
  lastDoc = null,
  statusFilter = 'all',
  startDate,
  endDate,
  userId,
  carId
}: ReservationsQueryParams): Promise<ReservationsResponse> {
  try {
    const reservationsCollection = collection(db, 'reservations');
    const constraints: QueryConstraint[] = [];

    // Add user filter if specified (for user-specific reservations)
    if (userId) {
      constraints.push(where('userRef', '==', doc(db, 'users', userId)));
    }

    // Add car filter if specified (for car-specific reservations)
    if (carId) {
      constraints.push(where('carRef', '==', doc(db, 'cars', carId)));
    }

    // Add status filter if specified
    if (statusFilter && statusFilter !== 'all') {
      constraints.push(where('status', '==', statusFilter));
    }

    // Add date range filter if specified
    if (startDate && endDate) {
      // Filter by date range: startDateTime >= startDate AND endDateTime <= endDate
      constraints.push(
        where('startDateTime', '>=', Timestamp.fromDate(startDate)),
        where('endDateTime', '<=', Timestamp.fromDate(endDate))
      );
    } else if (startDate) {
      // Filter by start date only: startDateTime >= startDate
      constraints.push(
        where('startDateTime', '>=', Timestamp.fromDate(startDate))
      );
    } else if (endDate) {
      // Filter by end date only: endDateTime <= endDate
      constraints.push(
        where('endDateTime', '<=', Timestamp.fromDate(endDate))
      );
    }

    // Add ordering
    constraints.push(orderBy('startDateTime', 'desc'));
    
    // Add pagination
    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }
    
    constraints.push(limit(pageSize + 1)); // Get one extra to check if there are more

    const q = query(reservationsCollection, ...constraints);
    const querySnapshot = await getDocs(q);
    
    const reservations: ReservationWithId[] = [];
    const docs = querySnapshot.docs;
    
    // Process documents
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

    // Check if there are more documents
    const hasMore = docs.length > pageSize;
    const newLastDoc = docs.length > 0 ? docs[Math.min(pageSize - 1, docs.length - 1)] : null;

    return {
      reservations,
      lastDoc: newLastDoc,
      hasMore
    };
  } catch (error) {
    console.error('Error fetching reservations:', error);
    throw error;
  }
}

// New function specifically for fetching user reservations
export async function fetchUserReservations({
  userId,
  pageSize = 10,
  lastDoc = null,
  statusFilter = 'all',
  startDate,
  endDate
}: ReservationsQueryParams & { userId: string }): Promise<ReservationsResponse> {
  return fetchReservations({
    userId,
    pageSize,
    lastDoc,
    statusFilter,
    startDate,
    endDate
  });
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