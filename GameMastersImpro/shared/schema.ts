import { pgTable, text, serial, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  role: text("role", { enum: ["admin", "employee", "customer"] }).notNull(),
  branchId: integer("branch_id").references(() => branches.id),
  displayName: text("display_name"),
  location: text("location"),
  lastActive: timestamp("last_active"),
});

export const branches = pgTable("branches", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
});

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  qrCode: text("qr_code").notNull().unique(),
  branchId: integer("branch_id").notNull().references(() => branches.id),
  status: text("status", { enum: ["available", "rented", "maintenance"] }).notNull().default("available"),
  totalRentals: integer("total_rentals").notNull().default(0),
  revenue: decimal("revenue").notNull().default("0"),
});

export const rentals = pgTable("rentals", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull().references(() => games.id),
  customerId: integer("customer_id").references(() => users.id),
  employeeId: integer("employee_id").notNull().references(() => users.id),
  branchId: integer("branch_id").notNull().references(() => branches.id),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  pausedAt: timestamp("paused_at"),
  totalCost: decimal("total_cost"),
  status: text("status", { enum: ["active", "paused", "completed"] }).notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  role: true,
  branchId: true,
  displayName: true,
  location: true,
});

export const insertGameSchema = createInsertSchema(games).pick({
  name: true,
  branchId: true,
  status: true,
});

export const insertRentalSchema = createInsertSchema(rentals).pick({
  gameId: true,
  customerId: true,
  employeeId: true,
  branchId: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Game = typeof games.$inferSelect;
export type Branch = typeof branches.$inferSelect;
export type Rental = typeof rentals.$inferSelect;