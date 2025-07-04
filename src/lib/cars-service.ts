import type { Car, CarStatus, CarWithId } from '@/types/car';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import {
  QueryConstraint,
  addDoc,
  collection,
  deleteDoc,
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

// Combined search function that searches both model and license plate
export async function searchCars(searchTerm: string, pageSize = 10): Promise<CarsResponse> {
  if (!searchTerm.trim()) {
    return fetchCars({ pageSize });
  }

  try {
    const carsCollection = collection(db, 'cars');
    const searchLower = searchTerm.toLowerCase().trim();
    const searchUpper = searchTerm.toUpperCase().trim();
        
    // Search by model (case-insensitive)
    const modelQuery = query(
      carsCollection,
      where('model', '>=', searchLower),
      where('model', '<=', searchLower + '\uf8ff'),
      orderBy('model'),
      limit(pageSize)
    );
    
    // Search by license plate (case-insensitive)
    const plateQuery = query(
      carsCollection,
      where('licensePlate', '>=', searchUpper),
      where('licensePlate', '<=', searchUpper + '\uf8ff'),
      orderBy('licensePlate'),
      limit(pageSize)
    );
    
    // Execute both queries in parallel
    const [modelSnapshot, plateSnapshot] = await Promise.all([
      getDocs(modelQuery),
      getDocs(plateQuery)
    ]);
    
    // Process model results
    const modelCars: CarWithId[] = [];
    modelSnapshot.docs.forEach((doc) => {
      const carData = doc.data() as Car;
      // Additional client-side filtering for exact match
      if (carData.model.toLowerCase().includes(searchLower)) {
        modelCars.push({
          id: doc.id,
          ...carData
        });
      }
    });
    
    // Process license plate results
    const plateCars: CarWithId[] = [];
    plateSnapshot.docs.forEach((doc) => {
      const carData = doc.data() as Car;
      // Additional client-side filtering for exact match
      if (carData.licensePlate.toUpperCase().includes(searchUpper)) {
        plateCars.push({
          id: doc.id,
          ...carData
        });
      }
    });
    
    // Combine and deduplicate results
    const combinedCars = [...modelCars];
    plateCars.forEach(car => {
      if (!combinedCars.some(existing => existing.id === car.id)) {
        combinedCars.push(car);
      }
    });
    
    // Sort combined results by relevance (exact matches first, then alphabetical)
    combinedCars.sort((a, b) => {
      const aModelExact = a.model.toLowerCase() === searchLower;
      const bModelExact = b.model.toLowerCase() === searchLower;
      const aPlateExact = a.licensePlate.toUpperCase() === searchUpper;
      const bPlateExact = b.licensePlate.toUpperCase() === searchUpper;
      
      // Exact matches first
      if (aModelExact || aPlateExact) {
        if (!(bModelExact || bPlateExact)) return -1;
      } else if (bModelExact || bPlateExact) {
        return 1;
      }
      
      // Then sort by model
      return a.model.localeCompare(b.model);
    });
    
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

// Fetch available cars for reservations
export async function fetchAvailableCars(): Promise<CarWithId[]> {
  try {
    const carsCollection = collection(db, 'cars');
    const q = query(
      carsCollection,
      where('status', '==', 'available'),
      orderBy('model')
    );
    
    const querySnapshot = await getDocs(q);
    const cars: CarWithId[] = [];
    
    querySnapshot.docs.forEach((doc) => {
      cars.push({
        id: doc.id,
        ...doc.data() as Car
      });
    });

    return cars;
  } catch (error) {
    console.error('Error fetching available cars:', error);
    throw error;
  }
} 