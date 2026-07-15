export const MAINTENANCE_TYPES = [
  "Service",
  "Engine Oil",
  "Chain Lube",
  "Accessories",
  "Tyres",
  "Insurance",
  "Wash",
  "Parking",
  "Fine",
  "Others",
] as const;

export type MaintenanceType = (typeof MAINTENANCE_TYPES)[number];

export const DAILY_EXPENSE_CATEGORIES = [
  "Breakfast",
  "Lunch",
  "Dinner",
  "Tea",
  "Milk",
  "Cigarette",
  "Bus/Train",
  "Other",
] as const;

export type DailyExpenseCategory = (typeof DAILY_EXPENSE_CATEGORIES)[number];
