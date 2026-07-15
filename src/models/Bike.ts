import { Schema, model, models, Types, type Document, type Model } from "mongoose";

export interface IChallanItem {
  challanNumber: string;
  date?: string;
  amount: number;
  status: string;
  offense?: string;
}

export interface IChallanCache {
  checkedAt: Date;
  pendingCount: number;
  totalAmount: number;
  items: IChallanItem[];
  raw?: unknown;
}

export interface IInsuranceCache {
  checkedAt: Date;
  valid: boolean;
  provider?: string;
  policyNumber?: string;
  expiryDate?: string;
  raw?: unknown;
}

export interface IBike extends Document {
  userId: Types.ObjectId;
  bikeName: string;
  bikeModel: string;
  brand: string;
  color: string;
  tankCapacity: number; // liters
  fuelType: "Petrol" | "Diesel" | "Electric";
  purchaseDate?: Date;
  currentOdometer: number; // km
  registrationNumber?: string; // e.g. MP09AB1234 — required for challan/insurance lookups
  isDefault: boolean;
  challanCache?: IChallanCache;
  insuranceCache?: IInsuranceCache;
}

const ChallanItemSchema = new Schema<IChallanItem>(
  {
    challanNumber: { type: String, required: true },
    date: { type: String },
    amount: { type: Number, required: true },
    status: { type: String, required: true },
    offense: { type: String },
  },
  { _id: false }
);

const ChallanCacheSchema = new Schema<IChallanCache>(
  {
    checkedAt: { type: Date, required: true },
    pendingCount: { type: Number, required: true, default: 0 },
    totalAmount: { type: Number, required: true, default: 0 },
    items: { type: [ChallanItemSchema], default: [] },
    raw: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const InsuranceCacheSchema = new Schema<IInsuranceCache>(
  {
    checkedAt: { type: Date, required: true },
    valid: { type: Boolean, required: true },
    provider: { type: String },
    policyNumber: { type: String },
    expiryDate: { type: String },
    raw: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const BikeSchema = new Schema<IBike>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    bikeName: { type: String, required: true, default: "BlackPearl" },
    bikeModel: { type: String, required: true, default: "Apache RTR 160 4V" },
    brand: { type: String, required: true, default: "TVS" },
    color: { type: String, required: true, default: "Black" },
    tankCapacity: { type: Number, required: true, default: 12 },
    fuelType: { type: String, enum: ["Petrol", "Diesel", "Electric"], default: "Petrol" },
    purchaseDate: { type: Date },
    currentOdometer: { type: Number, required: true, default: 0 },
    registrationNumber: { type: String, trim: true, uppercase: true },
    isDefault: { type: Boolean, default: false },
    challanCache: { type: ChallanCacheSchema },
    insuranceCache: { type: InsuranceCacheSchema },
  },
  { timestamps: true }
);

BikeSchema.index({ userId: 1, isDefault: 1 });

export const Bike: Model<IBike> =
  models.Bike || model<IBike>("Bike", BikeSchema);
