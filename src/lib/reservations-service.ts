import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import {
  QueryConstraint,
  Timestamp,
  collection,
  doc,
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
      constraints.push(where('userId', '==', userId));
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
      // Filter by date range
      constraints.push(
        where('startDateTime', '>=', Timestamp.fromDate(startDate)),
        where('startDateTime', '<=', Timestamp.fromDate(endDate))
      );
    } else if (startDate) {
      // Filter by start date only
      constraints.push(
        where('startDateTime', '>=', Timestamp.fromDate(startDate))
      );
    } else if (endDate) {
      // Filter by end date only
      constraints.push(
        where('startDateTime', '<=', Timestamp.fromDate(endDate))
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
  autoApproveCancellation: boolean
): Promise<{ status: ReservationStatus; message: string }> {
  try {
    const newStatus: ReservationStatus = autoApproveCancellation 
      ? 'cancelled' 
      : 'cancellation_pending';
    
    const reservationDoc = doc(db, 'reservations', reservationId);
    await updateDoc(reservationDoc, {
      status: newStatus,
      updatedAt: Timestamp.fromDate(new Date())
    });

    return {
      status: newStatus,
      message: autoApproveCancellation 
        ? 'Reservation cancelled successfully'
        : 'Cancellation request submitted for admin approval'
    };
  } catch (error) {
    console.error('Error requesting cancellation:', error);
    throw error;
  }
} 