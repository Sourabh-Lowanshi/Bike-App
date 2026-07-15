import { Schema, model, models, Types, type Document, type Model } from "mongoose";

export interface ITrip extends Document {
  userId: Types.ObjectId;
  bikeId: Types.ObjectId;
  startLocation: { lat: number; lng: number; name?: string };
  endLocation?: { lat: number; lng: number; name?: string };
  distance?: number; // km
  duration?: number; // seconds
  averageSpeed?: number; // km/h
  routePolyline?: string; // encoded polyline of path points
  status: "active" | "completed";
  date: Date;
  createdAt: Date;
}

const LocationSchema = new Schema(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    name: { type: String },
  },
  { _id: false }
);

const TripSchema = new Schema<ITrip>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  bikeId: { type: Schema.Types.ObjectId, ref: "Bike", required: true, index: true },
  startLocation: { type: LocationSchema, required: true },
  endLocation: { type: LocationSchema },
  distance: { type: Number },
  duration: { type: Number },
  averageSpeed: { type: Number },
  routePolyline: { type: String },
  status: { type: String, enum: ["active", "completed"], default: "active" },
  date: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

export const Trip: Model<ITrip> =
  models.Trip || model<ITrip>("Trip", TripSchema);
