import { Schema, model, models, Types, type Document, type Model } from "mongoose";

export interface IFuelEntry extends Document {
  userId: Types.ObjectId;
  bikeId: Types.ObjectId;
  date: Date;
  liters: number;
  amount: number;
  pricePerLiter: number;
  odometerReading: number;
  latitude?: number;
  longitude?: number;
  fuelStationName?: string;
  notes?: string;
  // Derived / cached fields, computed at write time relative to previous entry
  distanceSinceLast?: number;
  mileage?: number; // km/l
  createdAt: Date;
}

const FuelEntrySchema = new Schema<IFuelEntry>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  bikeId: { type: Schema.Types.ObjectId, ref: "Bike", required: true, index: true },
  date: { type: Date, required: true, default: Date.now },
  liters: { type: Number, required: true, min: 0.01 },
  amount: { type: Number, required: true, min: 0 },
  pricePerLiter: { type: Number, required: true, min: 0 },
  odometerReading: { type: Number, required: true },
  latitude: { type: Number },
  longitude: { type: Number },
  fuelStationName: { type: String },
  notes: { type: String },
  distanceSinceLast: { type: Number },
  mileage: { type: Number },
  createdAt: { type: Date, default: Date.now },
});

FuelEntrySchema.index({ bikeId: 1, odometerReading: 1 });

export const FuelEntry: Model<IFuelEntry> =
  models.FuelEntry || model<IFuelEntry>("FuelEntry", FuelEntrySchema);
