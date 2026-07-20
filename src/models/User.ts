import { Schema, model, models, type Document, type Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  image?: string;
  role: "user" | "admin";
  passwordHash?: string; // only set for email/password accounts, not Google/Guest
  resetTokenHash?: string;
  resetTokenExpiry?: Date;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  image: { type: String },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  passwordHash: { type: String, select: false },
  resetTokenHash: { type: String, select: false },
  resetTokenExpiry: { type: Date, select: false },
  createdAt: { type: Date, default: Date.now },
});

export const User: Model<IUser> =
  models.User || model<IUser>("User", UserSchema);
