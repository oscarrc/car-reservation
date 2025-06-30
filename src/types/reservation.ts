export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'cancellation_pending';

export interface Reservation {
  userId: string;
  userName: string;
  carId: string;
  carLicensePlate: string;
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