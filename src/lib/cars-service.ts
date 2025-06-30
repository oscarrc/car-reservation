import type { Car, CarStatus, CarWithId } from '@/types/car';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import {
  QueryConstraint,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  updateDoc,
  where
} from 'firebase/firestore';

import { db } from './firebase';

export interface CarsResponse {
  cars: CarWithId[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
  total?: number;
}

export interface CarsQueryParams {
  pageSize?: number;
  lastDoc?: QueryDocumentSnapshot<DocumentData> | null;
  searchTerm?: string;
}

export async function fetchCars({
  pageSize = 10,
  lastDoc = null,
  searchTerm = ''
}: CarsQueryParams): Promise<CarsResponse> {
  try {
    const carsCollection = collection(db, 'cars');
    const constraints: QueryConstraint[] = [];

    // Add search constraints if searchTerm is provided
    if (searchTerm.trim()) {
      // Search by model (Firestore limitation - we'll do client-side filtering for license plate)
      const searchLower = searchTerm.toLowerCase();
      constraints.push(
        where('model', '>=', searchLower),
        where('model', '<=', searchLower + '\uf8ff')
      );
    }

    // Add ordering
    constraints.push(orderBy('model'));
    
    // Add pagination
    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }
    
    constraints.push(limit(pageSize + 1)); // Get one extra to check if there are more

    const q = query(carsCollection, ...constraints);
    const querySnapshot = await getDocs(q);
    
    const cars: CarWithId[] = [];
    const docs = querySnapshot.docs;
    
    // Process documents
    docs.slice(0, pageSize).forEach((doc) => {
      cars.push({
        id: doc.id,
        ...doc.data() as Car
      });
    });

    // Check if there are more documents
    const hasMore = docs.length > pageSize;
    const newLastDoc = docs.length > 0 ? docs[Math.min(pageSize - 1, docs.length - 1)] : null;

    return {
      cars,
      lastDoc: newLastDoc,
      hasMore
    };
  } catch (error) {
    console.error('Error fetching cars:', error);
    throw error;
  }
}

// Search function for license plate
export async function searchCarsByLicensePlate(licensePlate: string, pageSize = 10): Promise<CarsResponse> {
  try {
    const carsCollection = collection(db, 'cars');
    const plateUpper = licensePlate.toUpperCase();
    
    const q = query(
      carsCollection,
      where('licensePlate', '>=', plateUpper),
      where('licensePlate', '<=', plateUpper + '\uf8ff'),
      orderBy('licensePlate'),
      limit(pageSize + 1)
    );

    const querySnapshot = await getDocs(q);
    const docs = querySnapshot.docs;
    
    const cars: CarWithId[] = [];
    docs.slice(0, pageSize).forEach((doc) => {
      cars.push({
        id: doc.id,
        ...doc.data() as Car
      });
    });

    const hasMore = docs.length > pageSize;
    const lastDoc = docs.length > 0 ? docs[Math.min(pageSize - 1, docs.length - 1)] : null;

    return {
      cars,
      lastDoc,
      hasMore
    };
  } catch (error) {
    console.error('Error searching cars by license plate:', error);
    throw error;
  }
}

// Combined search function that searches both model and license plate
export async function searchCars(searchTerm: string, pageSize = 10): Promise<CarsResponse> {
  if (!searchTerm.trim()) {
    return fetchCars({ pageSize });
  }

  try {
    // Search by model
    const modelResults = await fetchCars({ 
      pageSize: Math.ceil(pageSize / 2), 
      searchTerm 
    });
    
    // Search by license plate
    const plateResults = await searchCarsByLicensePlate(searchTerm, Math.ceil(pageSize / 2));
    
    // Combine and deduplicate results
    const combinedCars = [...modelResults.cars];
    plateResults.cars.forEach(car => {
      if (!combinedCars.some(existing => existing.id === car.id)) {
        combinedCars.push(car);
      }
    });

    // Sort combined results by model
    combinedCars.sort((a, b) => a.model.localeCompare(b.model));
    
    // Limit to requested page size
    const cars = combinedCars.slice(0, pageSize);
    
    return {
      cars,
      lastDoc: null, // For search, we don't use pagination
      hasMore: combinedCars.length > pageSize
    };
  } catch (error) {
    console.error('Error searching cars:', error);
    throw error;
  }
}

// Create a new car
export async function createCar(carData: Car): Promise<string> {
  try {
    const carsCollection = collection(db, 'cars');
    const docRef = await addDoc(carsCollection, carData);
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
    await updateDoc(carDocRef, carData);
  } catch (error) {
    console.error('Error updating car:', error);
    throw error;
  }
}

// Update car status
export async function updateCarStatus(carId: string, status: CarStatus): Promise<void> {
  try {
    const carDocRef = doc(db, 'cars', carId);
    await updateDoc(carDocRef, { status });
  } catch (error) {
    console.error('Error updating car status:', error);
    throw error;
  }
}

// New function to fetch multiple cars by their IDs
export async function fetchCarsByIds(carIds: string[]): Promise<CarWithId[]> {
  try {
    if (carIds.length === 0) {
      return [];
    }

    // Firestore 'in' queries are limited to 10 items, so we need to batch them
    const batches: Promise<CarWithId[]>[] = [];
    const batchSize = 10;
    
    for (let i = 0; i < carIds.length; i += batchSize) {
      const batchIds = carIds.slice(i, i + batchSize);
      
      const batchPromise = (async () => {
        const carsCollection = collection(db, 'cars');
        const q = query(carsCollection, where('__name__', 'in', batchIds));
        const querySnapshot = await getDocs(q);
        
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data() as Car
        }));
      })();
      
      batches.push(batchPromise);
    }
    
    const batchResults = await Promise.all(batches);
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