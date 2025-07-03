import type { Car, CarStatus } from '@/types/car';
import {
  Timestamp,
  collection,
  getDocs,
  query,
  where
} from 'firebase/firestore';

import type { ReservationStatus } from '@/types/reservation';
import { db } from './firebase';

export interface FleetStatusData {
  status: string;
  count: number;
  fill: string;
}

export interface DailyReservationData {
  day: string;
  confirmed: number;
  pending: number;
  cancellation_pending: number;
  cancelled: number;
}

export interface DashboardData {
  fleetStatus: FleetStatusData[];
  dailyReservations: DailyReservationData[];
  totalCars: number;
}

export async function fetchFleetStatus(): Promise<{fleetStatus: FleetStatusData[], totalCars: number}> {
  try {
    const carsCollection = collection(db, 'cars');
    const carsSnapshot = await getDocs(carsCollection);
    
    const statusCounts: Record<CarStatus, number> = {
      available: 0,
      maintenance: 0,
      out_of_service: 0,
    };

    carsSnapshot.docs.forEach((doc) => {
      const car = doc.data() as Car;
      statusCounts[car.status]++;
    });

    const fleetStatus: FleetStatusData[] = [
      {
        status: "available",
        count: statusCounts.available,
        fill: "var(--color-success)",
      },
      {
        status: "maintenance", 
        count: statusCounts.maintenance,
        fill: "var(--color-warning)",
      },
      {
        status: "out_of_service",
        count: statusCounts.out_of_service,
        fill: "var(--color-error)",
      },
    ];

    const totalCars = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);

    return { fleetStatus, totalCars };
  } catch (error) {
    console.error('Error fetching fleet status:', error);
    throw error;
  }
}

export async function fetchDailyReservations(year?: number, month?: number): Promise<DailyReservationData[]> {
  try {
    const now = new Date();
    const targetYear = year ?? now.getFullYear();
    const targetMonth = month ?? now.getMonth();
    
    const startOfMonth = new Date(Date.UTC(targetYear, targetMonth, 1, 0, 0, 0, 0));
    const endOfMonth = new Date(Date.UTC(targetYear, targetMonth + 1, 0, 23, 59, 59, 999));

    const reservationsCollection = collection(db, 'reservations');
    
    // Fetch all reservations for the current month
    const reservationsQuery = query(
      reservationsCollection,
      where('startDateTime', '>=', Timestamp.fromDate(startOfMonth)),
      where('startDateTime', '<=', Timestamp.fromDate(endOfMonth))
    );

    const reservationsSnapshot = await getDocs(reservationsQuery);
    const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    
    // Initialize daily counts for all days of the month
    const dailyCounts: Record<string, {confirmed: number, pending: number, cancellation_pending: number, cancelled: number}> = {};
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = day.toString().padStart(2, '0');
      dailyCounts[dayStr] = { confirmed: 0, pending: 0, cancellation_pending: 0, cancelled: 0 };
    }

    // Count reservations by day and status
    reservationsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const reservationDate = data.startDateTime.toDate();
      const day = reservationDate.getDate().toString().padStart(2, '0');
      const status = data.status as ReservationStatus;
      
      if (dailyCounts[day] && status in dailyCounts[day]) {
        (dailyCounts[day])[status]++;
      }
    });

    // Convert to array format for chart and sort by day
    const dailyReservations: DailyReservationData[] = Object.entries(dailyCounts)
      .map(([day, counts]) => ({
        day,
        confirmed: counts.confirmed,
        pending: counts.pending,
        cancellation_pending: counts.cancellation_pending,
        cancelled: counts.cancelled,
      }))
      .sort((a, b) => parseInt(a.day) - parseInt(b.day));

    return dailyReservations;
  } catch (error) {
    console.error('Error fetching daily reservations:', error);
    throw error;
  }
}

export async function fetchDashboardData(year?: number, month?: number): Promise<DashboardData> {
  try {
    const [fleetData, dailyReservations] = await Promise.all([
      fetchFleetStatus(),
      fetchDailyReservations(year, month)
    ]);

    return {
      fleetStatus: fleetData.fleetStatus,
      totalCars: fleetData.totalCars,
      dailyReservations
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
} 