/**
 * Migration scripts to update existing Firestore documents with searchKeywords
 * Run these scripts to migrate existing data to support the new search functionality
 */

import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import { generateCarSearchKeywords, generateUserSearchKeywords } from './search-utils';
import type { Car } from '@/types/car';
import type { UserProfile } from '@/types/user';

/**
 * Migrate existing car documents to include searchKeywords
 */
export async function migrateCarsSearchKeywords(): Promise<void> {
  try {
    console.log('Starting migration of car documents...');
    
    const carsCollection = collection(db, 'cars');
    const snapshot = await getDocs(carsCollection);
    
    const updatePromises = snapshot.docs.map(async (carDoc) => {
      const carData = carDoc.data() as Car;
      
      // Always regenerate search keywords with new logic
      const searchKeywords = generateCarSearchKeywords(carData);
      
      await updateDoc(doc(db, 'cars', carDoc.id), {
        searchKeywords
      });
      
      console.log(`Updated car document ${carDoc.id} with search keywords:`, searchKeywords);
    });
    
    await Promise.all(updatePromises);
    
    console.log(`Successfully migrated ${snapshot.docs.length} car documents`);
  } catch (error) {
    console.error('Error migrating car documents:', error);
    throw error;
  }
}

/**
 * Migrate existing user documents to include searchKeywords
 */
export async function migrateUsersSearchKeywords(): Promise<void> {
  try {
    console.log('Starting migration of user documents...');
    
    const usersCollection = collection(db, 'users');
    const snapshot = await getDocs(usersCollection);
    
    const updatePromises = snapshot.docs.map(async (userDoc) => {
      const userData = userDoc.data() as UserProfile;
      
      // Always regenerate search keywords with new logic
      const searchKeywords = generateUserSearchKeywords(userData);
      
      await updateDoc(doc(db, 'users', userDoc.id), {
        searchKeywords
      });
      
      console.log(`Updated user document ${userDoc.id} with search keywords:`, searchKeywords);
    });
    
    await Promise.all(updatePromises);
    
    console.log(`Successfully migrated ${snapshot.docs.length} user documents`);
  } catch (error) {
    console.error('Error migrating user documents:', error);
    throw error;
  }
}

/**
 * Run all migration scripts
 */
export async function runAllMigrations(): Promise<void> {
  try {
    console.log('Starting all migrations...');
    
    await migrateCarsSearchKeywords();
    await migrateUsersSearchKeywords();
    
    console.log('All migrations completed successfully!');
  } catch (error) {
    console.error('Error running migrations:', error);
    throw error;
  }
}

/**
 * Replace existing search keywords with new logic
 */
export async function replaceSearchKeywords(): Promise<void> {
  try {
    console.log('Starting replacement of search keywords with new logic...');
    
    await migrateCarsSearchKeywords();
    await migrateUsersSearchKeywords();
    
    console.log('Search keywords replacement completed successfully!');
  } catch (error) {
    console.error('Error replacing search keywords:', error);
    throw error;
  }
}

/**
 * Check how many documents need migration
 */
export async function checkMigrationStatus(): Promise<{
  cars: { total: number; migrated: number; needsMigration: number };
  users: { total: number; migrated: number; needsMigration: number };
}> {
  try {
    console.log('Checking migration status...');
    
    // Check cars
    const carsCollection = collection(db, 'cars');
    const carsSnapshot = await getDocs(carsCollection);
    const carsWithSearchKeywords = carsSnapshot.docs.filter(doc => 
      doc.data().searchKeywords
    );
    
    // Check users
    const usersCollection = collection(db, 'users');
    const usersSnapshot = await getDocs(usersCollection);
    const usersWithSearchKeywords = usersSnapshot.docs.filter(doc => 
      doc.data().searchKeywords
    );
    
    const status = {
      cars: {
        total: carsSnapshot.docs.length,
        migrated: carsWithSearchKeywords.length,
        needsMigration: carsSnapshot.docs.length - carsWithSearchKeywords.length
      },
      users: {
        total: usersSnapshot.docs.length,
        migrated: usersWithSearchKeywords.length,
        needsMigration: usersSnapshot.docs.length - usersWithSearchKeywords.length
      }
    };
    
    console.log('Migration status:', status);
    return status;
  } catch (error) {
    console.error('Error checking migration status:', error);
    throw error;
  }
}

/**
 * Helper function to test search functionality after migration
 */
export async function testSearchFunctionality(): Promise<void> {
  try {
    console.log('Testing search functionality...');
    
    // Test cars search
    const carsCollection = collection(db, 'cars');
    const carsSnapshot = await getDocs(carsCollection);
    
    if (carsSnapshot.docs.length > 0) {
      const sampleCar = carsSnapshot.docs[0].data() as Car;
      console.log('Sample car data:', sampleCar);
      console.log('Car search keywords:', sampleCar.searchKeywords);
    }
    
    // Test users search
    const usersCollection = collection(db, 'users');
    const usersSnapshot = await getDocs(usersCollection);
    
    if (usersSnapshot.docs.length > 0) {
      const sampleUser = usersSnapshot.docs[0].data() as UserProfile;
      console.log('Sample user data:', sampleUser);
      console.log('User search keywords:', sampleUser.searchKeywords);
    }
    
    console.log('Search functionality test completed!');
  } catch (error) {
    console.error('Error testing search functionality:', error);
    throw error;
  }
}

// All functions are already exported individually above 