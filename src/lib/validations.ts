import { z } from "zod";
import { MAINTENANCE_TYPES, DAILY_EXPENSE_CATEGORIES } from "@/lib/constants";

export const fuelEntrySchema = z.object({
  bikeId: z.string().min(1, "Select a bike"),
  date: z.coerce.date(),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  liters: z.coerce.number().positive("Liters must be greater than 0"),
  odometerReading: z.coerce.number().nonnegative("Odometer cannot be negative"),
  notes: z.string().max(500).optional().or(z.literal("")),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  fuelStationName: z.string().max(200).optional().or(z.literal("")),
});
export type FuelEntryInput = z.infer<typeof fuelEntrySchema>;

export const maintenanceSchema = z.object({
  bikeId: z.string().min(1, "Select a bike"),
  title: z.string().min(1, "Title is required").max(200),
  category: z.enum(MAINTENANCE_TYPES),
  amount: z.coerce.number().nonnegative(),
  odometer: z.coerce.number().nonnegative(),
  date: z.coerce.date(),
  notes: z.string().max(500).optional().or(z.literal("")),
  dueDate: z.coerce.date().optional(),
});
export type MaintenanceInput = z.infer<typeof maintenanceSchema>;

export const bikeSchema = z.object({
  bikeName: z.string().min(1).max(100),
  bikeModel: z.string().min(1).max(100),
  brand: z.string().min(1).max(100),
  color: z.string().min(1).max(50),
  tankCapacity: z.coerce.number().positive(),
  fuelType: z.enum(["Petrol", "Diesel", "Electric"]),
  currentOdometer: z.coerce.number().nonnegative(),
  purchaseDate: z.coerce.date().optional(),
  registrationNumber: z
    .string()
    .max(20)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v.toUpperCase().replace(/\s+/g, "") : undefined)),
});
export type BikeInput = z.infer<typeof bikeSchema>;

export const tripStartSchema = z.object({
  bikeId: z.string().min(1, "Select a bike"),
  lat: z.number(),
  lng: z.number(),
  name: z.string().optional(),
});

export const tripEndSchema = z.object({
  tripId: z.string(),
  lat: z.number(),
  lng: z.number(),
  name: z.string().optional(),
  distance: z.number().nonnegative(),
  duration: z.number().nonnegative(),
  routePolyline: z.string().optional(),
});

export const dailyExpenseSchema = z.object({
  category: z.enum(DAILY_EXPENSE_CATEGORIES),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  date: z.coerce.date(),
  notes: z.string().max(300).optional().or(z.literal("")),
});
export type DailyExpenseInput = z.infer<typeof dailyExpenseSchema>;
