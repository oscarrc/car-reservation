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
import type { ReservationStatus, ReservationWithId, Reservation } from '@/types/reservation';
import type { UserProfileWithId } from '@/types/user';
import type { CarWithId } from '@/types/car';
import { fetchUsersByIds } from './users-service';
import { fetchCarsByIds } from './cars-service';

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
  orderBy?: 'startDateTime' | 'endDateTime' | 'createdAt';
  orderDirection?: 'asc' | 'desc';
}

export interface ReservationsFilterParams {
  statusFilter?: ReservationStatus | 'all';
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  carId?: string;
  orderBy?: 'startDateTime' | 'endDateTime' | 'createdAt';
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
  const orderField = params.orderBy || 'startDateTime';
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
  const orderField = params.orderBy || 'startDateTime';
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
    const reservationDocs = docs.slice(0, pageSize);
    
    const userIds = [...new Set(reservationDocs.map(doc => (doc.data() as Reservation).userRef?.id).filter(id => !!id) as string[])];
    const carIds = [...new Set(reservationDocs.map(doc => (doc.data() as Reservation).carRef?.id).filter(id => !!id) as string[])];

    const [users, cars] = await Promise.all([
      userIds.length > 0 ? fetchUsersByIds(userIds) : Promise.resolve([]),
      carIds.length > 0 ? fetchCarsByIds(carIds) : Promise.resolve([])
    ]);

    const usersMap = new Map(users.map(user => [user.id, user]));
    const carsMap = new Map(cars.map(car => [car.id, car]));

    const reservations: ReservationWithId[] = reservationDocs.map(doc => {
      const data = doc.data() as Reservation;
      return {
        id: doc.id,
        ...data,
        userRef: usersMap.get(data.userRef?.id) as UserProfileWithId,
        carRef: carsMap.get(data.carRef?.id) as CarWithId,
        startDateTime: (data.startDateTime as Timestamp).toDate(),
        endDateTime: (data.endDateTime as Timestamp).toDate(),
        createdAt: (data.createdAt as Timestamp).toDate(),
        updatedAt: (data.updatedAt as Timestamp).toDate(),
      };
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
    
    const reservationData = reservationSnap.data() as Reservation;

    // Fetch user and car data
    let userData: UserProfileWithId | undefined;
    let carData: CarWithId | undefined;

    if (reservationData.userRef?.id) {
      const users = await fetchUsersByIds([reservationData.userRef.id]);
      if (users.length > 0) {
        userData = users[0];
      }
    }

    if (reservationData.carRef?.id) {
      const cars = await fetchCarsByIds([reservationData.carRef.id]);
      if (cars.length > 0) {
        carData = cars[0];
      }
    }

    return {
      id: reservationSnap.id,
      ...reservationData,
      userRef: userData,
      carRef: carData,
      startDateTime: (reservationData.startDateTime as Timestamp).toDate(),
      endDateTime: (reservationData.endDateTime as Timestamp).toDate(),
      createdAt: (reservationData.createdAt as Timestamp).toDate(),
      updatedAt: (reservationData.updatedAt as Timestamp).toDate(),
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

// Interface for reservations with populated car and user data
export interface ReservationWithCarAndUser extends ReservationWithId {
  carInfo?: CarWithId;
  userInfo?: UserProfileWithId;
}

interface ReservationsWithDataResponse {
  reservations: ReservationWithCarAndUser[];
  pagination: PaginationState;
}

// Helper function to build pagination state (simplified version)
// Note: This is a basic implementation. You might need a more robust one
// if you are handling complex pagination scenarios across different services.
function buildPaginationState(
  params: ReservationsQueryParams,
  docs: QueryDocumentSnapshot<DocumentData>[]
): PaginationState {
  const { pageSize = 25, pageIndex = 0 } = params;
  const hasNextPage = docs.length > pageSize;
  const actualDocs = hasNextPage ? docs.slice(0, pageSize) : docs;

  return {
    pageIndex,
    pageSize,
    startCursor: actualDocs.length > 0 ? actualDocs[0] : undefined,
    endCursor: actualDocs.length > 0 ? actualDocs[actualDocs.length - 1] : undefined,
    // You might want to add hasNextPage, hasPreviousPage flags if needed by UI
  };
}

export async function fetchReservationsWithPopulatedData(
  params: ReservationsQueryParams
): Promise<ReservationsWithDataResponse> {
  // Step 1: Fetch reservations with existing query builder
  const reservationsCollection = collection(db, 'reservations');
  const constraints = buildReservationsQueryConstraints(params); // Existing helper

  // Add cursor pagination
  if (params.cursor) {
    constraints.push(
      params.cursor.direction === 'forward'
        ? startAfter(params.cursor.docSnapshot)
        : endBefore(params.cursor.docSnapshot)
    );
  }

  // Ensure pageSize is defined, default if not
  const pageSize = params.pageSize || 25;
  constraints.push(limit(pageSize + 1)); // Fetch one extra to check for next page

  const q = query(reservationsCollection, ...constraints);
  const querySnapshot = await getDocs(q);

  // Slice to current page size after fetching one extra for pagination check
  const reservationDocs = querySnapshot.docs.slice(0, pageSize);

  if (reservationDocs.length === 0) {
    return {
      reservations: [],
      pagination: buildPaginationState(params, [])
    };
  }

  // Step 2: Extract unique DocumentReferences (not IDs)
  // Filter out undefined refs before mapping
  const uniqueUserRefs = Array.from(
    new Map(
      reservationDocs
        .map(doc => (doc.data() as Reservation).userRef)
        .filter(ref => ref) // Ensure ref is not undefined
        .map(ref => [ref.id, ref])
    ).values()
  );

  const uniqueCarRefs = Array.from(
    new Map(
      reservationDocs
        .map(doc => (doc.data() as Reservation).carRef)
        .filter(ref => ref) // Ensure ref is not undefined
        .map(ref => [ref.id, ref])
    ).values()
  );

  // Step 3: Parallel fetch using getDoc for each reference
  // Handle cases where uniqueUserRefs or uniqueCarRefs might be empty
  const [userDocs, carDocs] = await Promise.all([
    uniqueUserRefs.length > 0
      ? Promise.all(uniqueUserRefs.map(ref => getDoc(ref!))) // ref! because we filtered undefined
      : Promise.resolve([]),
    uniqueCarRefs.length > 0
      ? Promise.all(uniqueCarRefs.map(ref => getDoc(ref!))) // ref! because we filtered undefined
      : Promise.resolve([])
  ]);

  // Step 4: Create lookup maps
  const usersMap = new Map(
    userDocs
      .filter(doc => doc.exists())
      .map(doc => [doc.id, { id: doc.id, ...doc.data() } as UserProfileWithId])
  );

  const carsMap = new Map(
    carDocs
      .filter(doc => doc.exists())
      .map(doc => [doc.id, { id: doc.id, ...doc.data() } as CarWithId])
  );

  // Step 5: Build populated reservations
  const populatedReservations = reservationDocs.map(doc => {
    const data = doc.data() as Reservation; // Base reservation data
    // Construct ReservationWithId first
    const reservationWithId: ReservationWithId = {
      id: doc.id,
      ...data,
      // Convert Timestamps to Dates
      startDateTime: (data.startDateTime as Timestamp).toDate(),
      endDateTime: (data.endDateTime as Timestamp).toDate(),
      createdAt: (data.createdAt as Timestamp).toDate(),
      updatedAt: (data.updatedAt as Timestamp).toDate(),
    };

    // Then add carInfo and userInfo to create ReservationWithCarAndUser
    return {
      ...reservationWithId,
      carInfo: data.carRef ? carsMap.get(data.carRef.id) : undefined,
      userInfo: data.userRef ? usersMap.get(data.userRef.id) : undefined,
    } as ReservationWithCarAndUser;
  });

  return {
    reservations: populatedReservations,
    pagination: buildPaginationState(params, querySnapshot.docs) // Pass original docs for pagination logic
  };
}