import { Schema, model, models, Types, type Document, type Model } from "mongoose";
import { MAINTENANCE_TYPES, type MaintenanceType } from "@/lib/constants";

export { MAINTENANCE_TYPES, type MaintenanceType };

export interface IMaintenance extends Document {
  userId: Types.ObjectId;
  bikeId: Types.ObjectId;
  title: string;
  category: MaintenanceType;
  amount: number;
  odometer: number;
  date: Date;
  notes?: string;
  dueDate?: Date; // for service/insurance/PUC expiry notifications
  createdAt: Date;
}

const MaintenanceSchema = new Schema<IMaintenance>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  bikeId: { type: Schema.Types.ObjectId, ref: "Bike", required: true, index: true },
  title: { type: String, required: true },
  category: { type: String, enum: MAINTENANCE_TYPES, default: "Others" },
  amount: { type: Number, required: true, min: 0 },
  odometer: { type: Number, required: true },
  date: { type: Date, required: true, default: Date.now },
  notes: { type: String },
  dueDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

export const Maintenance: Model<IMaintenance> =
  models.Maintenance || model<IMaintenance>("Maintenance", MaintenanceSchema);
