export type CarStatus = 'available' | 'maintenance' | 'out_of_service';

export interface Car {
  licensePlate: string;
  model: string;
  status: CarStatus;
  seats: number;
  color: string;
  description?: string;
}

export interface CarWithId extends Car {
  id: string;
} 