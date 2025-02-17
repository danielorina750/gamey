import { db } from "../firebase";
import { collection } from "firebase/firestore";

// Collection references
export const usersCollection = collection(db, "users");
export const gamesCollection = collection(db, "games");
export const rentalsCollection = collection(db, "rentals");
export const branchesCollection = collection(db, "branches");

// Types for Firestore documents
export interface FirestoreUser {
  email: string;
  role: "admin" | "employee" | "customer";
  branchId: number | null;
  location: string | null;
  displayName: string | null;
  lastLogin: Date;
  createdAt: Date;
}

export interface FirestoreGame {
  name: string;
  qrCode: string;
  branchId: number;
  status: "available" | "rented" | "maintenance";
  totalRentals: number;
  revenue: number;
  createdAt: Date;
}

export interface FirestoreRental {
  gameId: number;
  customerId: number;
  employeeId: number;
  branchId: number;
  startTime: Date;
  endTime: Date | null;
  pausedAt: Date | null;
  totalCost: number | null;
  status: "active" | "paused" | "completed";
}

export interface FirestoreBranch {
  name: string;
  location: string;
  revenue: number;
  activeGames: number;
  totalGames: number;
}
