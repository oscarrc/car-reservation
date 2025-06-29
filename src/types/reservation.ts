export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled';

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
}

export interface ReservationWithId extends Reservation {
  id: string;
} 