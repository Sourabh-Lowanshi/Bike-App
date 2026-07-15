import { Schema, model, models, Types, type Document, type Model } from "mongoose";
import { DAILY_EXPENSE_CATEGORIES, type DailyExpenseCategory } from "@/lib/constants";

export { DAILY_EXPENSE_CATEGORIES, type DailyExpenseCategory };

export interface IDailyExpense extends Document {
  userId: Types.ObjectId;
  category: DailyExpenseCategory;
  amount: number;
  date: Date;
  notes?: string;
  createdAt: Date;
}

const DailyExpenseSchema = new Schema<IDailyExpense>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  category: { type: String, enum: DAILY_EXPENSE_CATEGORIES, required: true },
  amount: { type: Number, required: true, min: 0 },
  date: { type: Date, required: true, default: Date.now },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
});

DailyExpenseSchema.index({ userId: 1, date: -1 });

export const DailyExpense: Model<IDailyExpense> =
  models.DailyExpense || model<IDailyExpense>("DailyExpense", DailyExpenseSchema);
