export type FuelType = "Petrol" | "Diesel" | "Electric" | "CNG";

export type ExpenseCategory =
  | "Fuel"
  | "Service"
  | "Engine Oil"
  | "Chain Lube"
  | "Accessories"
  | "Tyres"
  | "Insurance"
  | "Wash"
  | "Parking"
  | "Fine"
  | "Others";

export interface IUser {
  _id: string;
  name: string;
  email: string;
  image?: string;
  role?: "user" | "admin";
  createdAt: string;
}

export interface IChallanItem {
  challanNumber: string;
  date?: string;
  amount: number;
  status: string;
  offense?: string;
}

export interface IChallanCache {
  checkedAt: string;
  pendingCount: number;
  totalAmount: number;
  items: IChallanItem[];
}

export interface IInsuranceCache {
  checkedAt: string;
  valid: boolean;
  provider?: string;
  policyNumber?: string;
  expiryDate?: string;
}

export interface IBike {
  _id: string;
  userId: string;
  bikeName: string;
  bikeModel: string;
  brand: string;
  color: string;
  tankCapacity: number; // litres
  fuelType: FuelType;
  purchaseDate: string;
  currentOdometer: number;
  registrationNumber?: string;
  isDefault?: boolean;
  challanCache?: IChallanCache;
  insuranceCache?: IInsuranceCache;
}

export interface IFuelEntry {
  _id: string;
  userId: string;
  bikeId: string;
  date: string;
  liters: number;
  amount: number;
  pricePerLiter: number;
  odometerReading: number;
  latitude?: number;
  longitude?: number;
  fuelStationName?: string;
  notes?: string;
  distanceSinceLast?: number;
  mileage?: number; // km/l, computed & stored
  createdAt: string;
}

export interface ITripPoint {
  lat: number;
  lng: number;
  timestamp: number;
}

export interface ITrip {
  _id: string;
  userId: string;
  bikeId: string;
  startLocation: { lat: number; lng: number; label?: string };
  endLocation?: { lat: number; lng: number; label?: string };
  distance: number; // km
  duration: number; // seconds
  averageSpeed: number; // km/h
  routePolyline: ITripPoint[];
  date: string;
  status: "active" | "completed";
}

export interface IMaintenance {
  _id: string;
  userId: string;
  bikeId: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  odometer: number;
  date: string;
  notes?: string;
}

export interface DashboardStats {
  totalFuelCost: number;
  todaysFuel: number;
  monthlyFuel: number;
  averageMileage: number;
  distanceThisMonth: number;
  lastRefuel: { date: string; liters: number; amount: number } | null;
  fuelRemaining: number;
  maintenanceCost: number;
  lifetimeExpense: number;
}

export interface MonthlyExpensePoint {
  month: string;
  fuel: number;
  maintenance: number;
}

export interface MileageTrendPoint {
  date: string;
  mileage: number;
}

export interface DistancePoint {
  date: string;
  distance: number;
}

export interface ExpenseSlice {
  name: string;
  value: number;
}

export interface WeeklyTripPoint {
  day: string;
  trips: number;
  distance: number;
}

export interface AnalyticsData {
  averageMileage: number;
  bestMileage: number;
  worstMileage: number;
  monthlyAverageMileage: { month: string; mileage: number }[];
  fuelCostPerKm: number;
  costPerDay: number;
  costPerMonth: number;
  costPerYear: number;
  fuelEfficiencyScore: number; // 0-100
  totalDistance: number;
  estimatedFuelRemaining: number;
}
