import type { DocumentReference } from 'firebase/firestore';

export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'cancellation_pending';

export interface Reservation {
  userRef: DocumentReference;
  carRef: DocumentReference;
  startDateTime: Date;
  endDateTime: Date;
  status: ReservationStatus;
  createdAt: Date;
  updatedAt: Date;
  driver?: string;
  comments?: string;
}

export interface ReservationWithId extends Reservation {
  id: string;
} 