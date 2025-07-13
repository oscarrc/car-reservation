import type { Car, CarStatus, CarWithId } from '@/types/car';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import {
  QueryConstraint,
  addDoc,
  collection,
  deleteDoc,
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
import { batchArray, batchPromises } from './batch-utils';
import { generateCarSearchKeywords, prepareSearchTerms } from './search-utils';

import { db } from './firebase';

// Common pagination interfaces
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

export interface CarsResponse {
  cars: CarWithId[];
  pagination: PaginationState;
}

export interface CarsQueryParams {
  pageSize?: number;
  pageIndex?: number;
  cursor?: PaginationCursor;
  searchTerm?: string;
  status?: CarStatus;
  orderBy?: 'model' | 'licensePlate' | 'updatedAt';
  orderDirection?: 'asc' | 'desc';
}

export interface CarsFilterParams {
  searchTerm?: string;
  status?: CarStatus;
  orderBy?: 'model' | 'licensePlate' | 'updatedAt';
  orderDirection?: 'asc' | 'desc';
  seats?: 'all' | number
}

// Helper function to build query constraints
function buildCarsQueryConstraints(params: CarsQueryParams): QueryConstraint[] {
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
function buildCarsFilterConstraints(params: CarsFilterParams): QueryConstraint[] {
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

// Get total count with filters
export async function getCarsCount(params: CarsFilterParams): Promise<number> {
  try {
    const carsCollection = collection(db, 'cars');
    const constraints = buildCarsFilterConstraints(params);
    
    const countQuery = query(carsCollection, ...constraints);
    const countSnapshot = await getCountFromServer(countQuery);
    
    return countSnapshot.data().count;
  } catch (error) {
    console.error('Error getting cars count:', error);
    throw error;
  }
}

export async function fetchCars(params: CarsQueryParams): Promise<CarsResponse> {
  try {
    const {
      pageSize = 25,
      pageIndex = 0,
      cursor,
    } = params;

    const carsCollection = collection(db, 'cars');
    const constraints = buildCarsQueryConstraints(params);

    // Add cursor pagination
    if (cursor) {
      if (cursor.direction === 'forward') {
        constraints.push(startAfter(cursor.docSnapshot));
      } else {
        constraints.push(endBefore(cursor.docSnapshot));
      }
    }

    // Add limit (get one extra to check if there are more pages)
    constraints.push(limit(pageSize + 1));

    const q = query(carsCollection, ...constraints);
    const querySnapshot = await getDocs(q);
    
    const docs = querySnapshot.docs;
    const cars: CarWithId[] = [];

    // Process documents (exclude the extra one used for pagination check)
    docs.slice(0, pageSize).forEach((doc) => {
      const data = doc.data();
      cars.push({
        id: doc.id,        
        ...data as Car,        
        createdAt: data?.createdAt?.toDate() || new Date(),
        updatedAt: data?.updatedAt?.toDate() || new Date(),
      });
    });

    // Calculate pagination state
    const startCursor = docs.length > 0 ? docs[0] : undefined;
    const endCursor = docs.length > 0 ? docs[Math.min(pageSize - 1, docs.length - 1)] : undefined;

    return {
      cars,
      pagination: {
        pageIndex,
        pageSize,
        startCursor,
        endCursor
      }
    };
  } catch (error) {
    console.error('Error fetching cars:', error);
    throw error;
  }
}

// Search cars with cursor pagination
export async function searchCars(searchTerm: string, params: Omit<CarsQueryParams, 'searchTerm'>): Promise<CarsResponse> {
  return fetchCars({ ...params, searchTerm });
}

// Create a new car
export async function createCar(carData: Car): Promise<string> {
  try {
    const carsCollection = collection(db, 'cars');
    const now = new Date();
    
    // Generate search keywords for the car
    const searchKeywords = generateCarSearchKeywords(carData);

    if(!carData.description) delete carData.description;
    
    const carWithSearchKeywords = {
      ...carData,
      searchKeywords,
      createdAt: now,
      updatedAt: now
    };
    
    const docRef = await addDoc(carsCollection, carWithSearchKeywords);
    return docRef.id;
  } catch (error) {
    console.error('Error creating car:', error);
    throw error;
  }
}

// Update car data
export async function updateCar(carId: string, carData: Partial<Car>): Promise<void> {
  try {
    const carDocRef = doc(db, 'cars', carId);
    
    // If any searchable fields are being updated, regenerate search keywords
    const searchableFields = ['model', 'licensePlate', 'color'];
    const isSearchableFieldUpdated = searchableFields.some(field => field in carData);
    
    if (isSearchableFieldUpdated) {
      // Get current car data to merge with updates
      const currentCarDoc = await getDoc(carDocRef);
      if (currentCarDoc.exists()) {
        const currentCarData = currentCarDoc.data() as Car;
        const mergedCarData = { ...currentCarData, ...carData };
        
        // Generate new search keywords
        const searchKeywords = generateCarSearchKeywords(mergedCarData); 

        if (!carData.description) delete carData.description;
        
        await updateDoc(carDocRef, {
          ...carData,
          searchKeywords,
          updatedAt: new Date()
        });
      } else {
        await updateDoc(carDocRef, {
          ...carData,
          updatedAt: new Date()
        });
      }
    } else {
      await updateDoc(carDocRef, {
        ...carData,
        updatedAt: new Date()
      });
    }
  } catch (error) {
    console.error('Error updating car:', error);
    throw error;
  }
}

// Update car status
export async function updateCarStatus(carId: string, status: CarStatus): Promise<void> {
  try {
    const carDocRef = doc(db, 'cars', carId);
    await updateDoc(carDocRef, { 
      status,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating car status:', error);
    throw error;
  }
}

// New function to fetch multiple cars by their IDs
// Fetch a single car by ID
export async function fetchCarById(carId: string): Promise<CarWithId | null> {
  try {
    const carDoc = doc(db, 'cars', carId);
    const docSnap = await getDoc(carDoc);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data() as Car
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching car by ID:', error);
    throw error;
  }
}

export async function fetchCarsByIds(carIds: string[]): Promise<CarWithId[]> {
  try {
    if (carIds.length === 0) {
      return [];
    }

    // Use the batch utility for more efficient batching
    const batches = batchArray(carIds);
    
    const promises = batches.map(async (batchIds) => {
      const carsCollection = collection(db, 'cars');
      const q = query(carsCollection, where('__name__', 'in', batchIds));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as Car
      }));
    });
    
    const batchResults = await batchPromises(promises);
    return batchResults.flat();
  } catch (error) {
    console.error('Error fetching cars by IDs:', error);
    throw error;
  }
}

// Delete a car
export async function deleteCar(carId: string): Promise<void> {
  try {
    const carDocRef = doc(db, 'cars', carId);
    await deleteDoc(carDocRef);
  } catch (error) {
    console.error('Error deleting car:', error);
    throw error;
  }
}

// Fetch available cars for reservations
export async function fetchAvailableCars(): Promise<CarWithId[]> {
  try {
    const response = await fetchCars({ 
      status: 'available',
      pageSize: 1000, // Get all available cars
      orderBy: 'model' 
    });
    return response.cars;
  } catch (error) {
    console.error('Error fetching available cars:', error);
    throw error;
  }
}

// Fetch cars available for a specific date/time range
export async function fetchAvailableCarsForDateRange(
  startDateTime: Date,
  endDateTime: Date
): Promise<CarWithId[]> {
  try {
    // First get all cars with status 'available'
    const availableCars = await fetchAvailableCars();
    
    if (availableCars.length === 0) {
      return [];
    }

    // Get all confirmed/pending reservations that might conflict with the requested time range
    // We need reservations that overlap with our time period:
    // - Reservation starts before our period ends AND
    // - Reservation ends after our period starts
    const reservationsCollection = collection(db, 'reservations');
    const reservationsQuery = query(
      reservationsCollection,
      where('status', 'in', ['pending', 'confirmed']),
      where('startDateTime', '<', endDateTime),
      where('endDateTime', '>', startDateTime)
    );

    const reservationsSnapshot = await getDocs(reservationsQuery);
    const conflictingCarIds = new Set<string>();
    
    // Add car IDs from all overlapping reservations (query already filters for overlap)
    reservationsSnapshot.docs.forEach((reservationDoc) => {
      const reservation = reservationDoc.data();
      conflictingCarIds.add(reservation.carRef.id);
    });

    // Filter out cars that have conflicting reservations
    return availableCars.filter(car => !conflictingCarIds.has(car.id));
  } catch (error) {
    console.error('Error fetching available cars for date range:', error);
    throw error;
  }
} 

// Bulk operations for cars
export async function bulkUpdateCarStatus(
  carIds: string[],
  status: CarStatus
): Promise<{ successCount: number; errorCount: number; errors: string[] }> {
  try {
    const batchSize = 500; // Firestore batch limit
    const batches = [];
    const errors: string[] = [];
    let successCount = 0;
    let errorCount = 0;

    // Process cars in batches
    for (let i = 0; i < carIds.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchIds = carIds.slice(i, i + batchSize);
      
      batchIds.forEach((carId) => {
        const carDoc = doc(db, 'cars', carId);
        batch.update(carDoc, {
          status,
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

export async function bulkDeleteCars(
  carIds: string[]
): Promise<{ successCount: number; errorCount: number; errors: string[] }> {
  try {
    const batchSize = 500; // Firestore batch limit
    const batches = [];
    const errors: string[] = [];
    let successCount = 0;
    let errorCount = 0;

    // Process cars in batches
    for (let i = 0; i < carIds.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchIds = carIds.slice(i, i + batchSize);
      
      batchIds.forEach((carId) => {
        const carDoc = doc(db, 'cars', carId);
        batch.delete(carDoc);
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
        errors.push(`Failed to delete batch: ${(error as Error).message}`);
        console.error('Error in batch deletion:', error);
      }
    }

    return { successCount, errorCount, errors };
  } catch (error) {
    console.error('Error in bulk deletion:', error);
    throw error;
  }
} 