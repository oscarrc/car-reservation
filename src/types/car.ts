export type CarStatus = 'available' | 'maintenance' | 'out_of_service';

export interface Car {
  licensePlate: string;
  model: string;
  status: CarStatus;
  seats: number;
  color: string;
  year?: number;
  description?: string;
  searchKeywords?: string[];  
  createdAt: Date;
  updatedAt: Date;
}

export interface CarWithId extends Car {
  id: string;
} 