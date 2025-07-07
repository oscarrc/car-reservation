/**
 * Migration scripts to update existing Firestore documents with searchKeywords, createdAt, and updatedAt
 * Run these scripts to migrate existing data to support the new search functionality and timestamp tracking
 */

import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import { generateCarSearchKeywords, generateUserSearchKeywords } from './search-utils';
import type { Car } from '@/types/car';
import type { UserProfile } from '@/types/user';

/**
 * Migrate existing car documents to include searchKeywords, createdAt, and updatedAt
 */
export async function migrateCarsSearchKeywords(): Promise<void> {
  try {
    console.log('Starting migration of car documents...');
    
    const carsCollection = collection(db, 'cars');
    const snapshot = await getDocs(carsCollection);
    
    const updatePromises = snapshot.docs.map(async (carDoc) => {
      const carData = carDoc.data() as Car;
      const now = new Date();
      
      // Always regenerate search keywords with new logic
      const searchKeywords = generateCarSearchKeywords(carData);
      
      const updateData: any = {
        searchKeywords
      };
      
      // Add createdAt if it doesn't exist
      if (!carData.createdAt) {
        updateData.createdAt = now;
      }
      
      // Add or update updatedAt
      updateData.updatedAt = now;
      
      await updateDoc(doc(db, 'cars', carDoc.id), updateData);
      
      console.log(`Updated car document ${carDoc.id} with search keywords and timestamps`);
    });
    
    await Promise.all(updatePromises);
    
    console.log(`Successfully migrated ${snapshot.docs.length} car documents`);
  } catch (error) {
    console.error('Error migrating car documents:', error);
    throw error;
  }
}

/**
 * Migrate existing user documents to include searchKeywords, createdAt, and updatedAt
 */
export async function migrateUsersSearchKeywords(): Promise<void> {
  try {
    console.log('Starting migration of user documents...');
    
    const usersCollection = collection(db, 'users');
    const snapshot = await getDocs(usersCollection);
    
    const updatePromises = snapshot.docs.map(async (userDoc) => {
      const userData = userDoc.data() as UserProfile;
      const now = new Date();
      
      // Always regenerate search keywords with new logic
      const searchKeywords = generateUserSearchKeywords(userData);
      
      const updateData: any = {
        searchKeywords
      };
      
      // Add createdAt if it doesn't exist
      if (!userData.createdAt) {
        updateData.createdAt = now;
      }
      
      // Add or update updatedAt
      updateData.updatedAt = now;
      
      await updateDoc(doc(db, 'users', userDoc.id), updateData);
      
      console.log(`Updated user document ${userDoc.id} with search keywords and timestamps`);
    });
    
    await Promise.all(updatePromises);
    
    console.log(`Successfully migrated ${snapshot.docs.length} user documents`);
  } catch (error) {
    console.error('Error migrating user documents:', error);
    throw error;
  }
}

/**
 * Migrate existing reservations documents to include createdAt and updatedAt if missing
 */
export async function migrateReservationsTimestamps(): Promise<void> {
  try {
    console.log('Starting migration of reservation documents...');
    
    const reservationsCollection = collection(db, 'reservations');
    const snapshot = await getDocs(reservationsCollection);
    
    const updatePromises = snapshot.docs.map(async (reservationDoc) => {
      const reservationData = reservationDoc.data();
      const now = new Date();
      
      const updateData: any = {};
      
      // Add createdAt if it doesn't exist
      if (!reservationData.createdAt) {
        updateData.createdAt = now;
      }
      
      // Add updatedAt if it doesn't exist
      if (!reservationData.updatedAt) {
        updateData.updatedAt = now;
      }
      
      // Only update if there's something to update
      if (Object.keys(updateData).length > 0) {
        await updateDoc(doc(db, 'reservations', reservationDoc.id), updateData);
        console.log(`Updated reservation document ${reservationDoc.id} with timestamps`);
      }
    });
    
    await Promise.all(updatePromises);
    
    console.log(`Successfully migrated ${snapshot.docs.length} reservation documents`);
  } catch (error) {
    console.error('Error migrating reservation documents:', error);
    throw error;
  }
}

/**
 * Migrate existing allowedEmails documents to use createdAt and updatedAt instead of timestamp
 */
export async function migrateAllowedEmailsTimestamps(): Promise<void> {
  try {
    console.log('Starting migration of allowedEmails documents...');
    
    const allowedEmailsCollection = collection(db, 'allowedEmails');
    const snapshot = await getDocs(allowedEmailsCollection);
    
    const updatePromises = snapshot.docs.map(async (emailDoc) => {
      const emailData = emailDoc.data();
      const updateData: any = {};
      
      // Convert timestamp to createdAt and updatedAt if timestamp exists
      if (emailData.timestamp) {
        const timestamp = emailData.timestamp.toDate ? emailData.timestamp.toDate() : emailData.timestamp;
        updateData.createdAt = timestamp;
        updateData.updatedAt = timestamp;
        
        // Note: We don't remove the timestamp field in case it's still referenced elsewhere
        // It will be ignored by the new code
      } else {
        // If no timestamp, use current date
        const now = new Date();
        updateData.createdAt = now;
        updateData.updatedAt = now;
      }
      
      await updateDoc(doc(db, 'allowedEmails', emailDoc.id), updateData);
      console.log(`Updated allowedEmail document ${emailDoc.id} with createdAt and updatedAt`);
    });
    
    await Promise.all(updatePromises);
    
    console.log(`Successfully migrated ${snapshot.docs.length} allowedEmail documents`);
  } catch (error) {
    console.error('Error migrating allowedEmail documents:', error);
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
    await migrateReservationsTimestamps();
    await migrateAllowedEmailsTimestamps();
    
    console.log('All migrations completed successfully!');
  } catch (error) {
    console.error('Error running migrations:', error);
    throw error;
  }
}

/**
 * Replace existing search keywords with new logic and ensure timestamps
 */
export async function replaceSearchKeywords(): Promise<void> {
  try {
    console.log('Starting replacement of search keywords with new logic...');
    
    await migrateCarsSearchKeywords();
    await migrateUsersSearchKeywords();
    await migrateReservationsTimestamps();
    await migrateAllowedEmailsTimestamps();
    
    console.log('Search keywords replacement and timestamp migration completed successfully!');
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
  reservations: { total: number; migrated: number; needsMigration: number };
  allowedEmails: { total: number; migrated: number; needsMigration: number };
}> {
  try {
    console.log('Checking migration status...');
    
    // Check cars
    const carsCollection = collection(db, 'cars');
    const carsSnapshot = await getDocs(carsCollection);
    const carsWithTimestamps = carsSnapshot.docs.filter(doc => 
      doc.data().searchKeywords && doc.data().createdAt && doc.data().updatedAt
    );
    
    // Check users
    const usersCollection = collection(db, 'users');
    const usersSnapshot = await getDocs(usersCollection);
    const usersWithTimestamps = usersSnapshot.docs.filter(doc => 
      doc.data().searchKeywords && doc.data().createdAt && doc.data().updatedAt
    );
    
    // Check reservations
    const reservationsCollection = collection(db, 'reservations');
    const reservationsSnapshot = await getDocs(reservationsCollection);
    const reservationsWithTimestamps = reservationsSnapshot.docs.filter(doc => 
      doc.data().createdAt && doc.data().updatedAt
    );
    
    // Check allowedEmails
    const allowedEmailsCollection = collection(db, 'allowedEmails');
    const allowedEmailsSnapshot = await getDocs(allowedEmailsCollection);
    const allowedEmailsWithTimestamps = allowedEmailsSnapshot.docs.filter(doc => 
      doc.data().createdAt && doc.data().updatedAt
    );
    
    const status = {
      cars: {
        total: carsSnapshot.docs.length,
        migrated: carsWithTimestamps.length,
        needsMigration: carsSnapshot.docs.length - carsWithTimestamps.length
      },
      users: {
        total: usersSnapshot.docs.length,
        migrated: usersWithTimestamps.length,
        needsMigration: usersSnapshot.docs.length - usersWithTimestamps.length
      },
      reservations: {
        total: reservationsSnapshot.docs.length,
        migrated: reservationsWithTimestamps.length,
        needsMigration: reservationsSnapshot.docs.length - reservationsWithTimestamps.length
      },
      allowedEmails: {
        total: allowedEmailsSnapshot.docs.length,
        migrated: allowedEmailsWithTimestamps.length,
        needsMigration: allowedEmailsSnapshot.docs.length - allowedEmailsWithTimestamps.length
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