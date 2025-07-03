import { doc, getDoc, setDoc } from 'firebase/firestore';

import { db } from './firebase';

export interface AppSettings {
  // Existing settings
  advanceReservation: number; // days before reservation needs to be made (mon-fri)
  autoCancelation: boolean; // whether cancellation requires admin confirmation
  autoReservation: boolean; // whether reservation requires admin confirmation
  
  // Additional useful settings
  maxReservationDuration: number; // maximum days a car can be reserved
  weekendReservations: boolean; // allow weekend reservations
  minTimeBetweenReservations: number; // minimum hours between reservations for same user
  advanceCancellationTime: number; // hours before reservation start to allow cancellation
  maxConcurrentReservations: number; // maximum concurrent reservations per user
  businessHoursStart: string; // business hours start time (HH:mm format)
  businessHoursEnd: string; // business hours end time (HH:mm format)
  supportEmails: string[]; // support email addresses
}

const DEFAULT_SETTINGS: AppSettings = {
  advanceReservation: 1,
  autoCancelation: false,
  autoReservation: false,
  maxReservationDuration: 7,
  weekendReservations: true,
  minTimeBetweenReservations: 2,
  advanceCancellationTime: 24,
  maxConcurrentReservations: 2,
  businessHoursStart: "08:00",
  businessHoursEnd: "18:00",
  supportEmails: [],
};

const SETTINGS_DOC_ID = 'app-settings';

export async function fetchSettings(): Promise<AppSettings> {
  try {
    const settingsRef = doc(db, 'settings', SETTINGS_DOC_ID);
    const settingsSnap = await getDoc(settingsRef);
    
    if (settingsSnap.exists()) {
      const data = settingsSnap.data();
      // Merge with defaults to handle new settings
      return { ...DEFAULT_SETTINGS, ...data } as AppSettings;
    } else {
      // Create default settings document if it doesn't exist
      await setDoc(settingsRef, DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
  } catch (error) {
    console.error('Error fetching settings:', error);
    throw new Error('Failed to fetch settings');
  }
}

export async function updateSettings(settings: AppSettings): Promise<void> {
  try {
    const settingsRef = doc(db, 'settings', SETTINGS_DOC_ID);
    await setDoc(settingsRef, settings, { merge: true });
  } catch (error) {
    console.error('Error updating settings:', error);
    throw new Error('Failed to update settings');
  }
} 