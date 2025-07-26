// lib/models/DailyCash.ts
import mongoose, { Schema, Types, model } from 'mongoose';

export interface IDailyCash {
  _id: Types.ObjectId;
  date: Date;
  openingBalance: number;
  closingBalance: number;
  cashSales: number;
  cardSales: number;
  insuranceSales: number;
  expenses: number;
  discrepancy: number;
  verifiedBy: Types.ObjectId;
  notes?: string;
  prescriptions: Types.ObjectId[];
  expenseRecords: Types.ObjectId[];
}

const dailyCashSchema = new Schema<IDailyCash>({
  date: { type: Date, required: true, unique: true },
  openingBalance: { type: Number, required: true, min: 0 },
  closingBalance: { type: Number, required: true, min: 0 },
  cashSales: { type: Number, default: 0, min: 0 },
  cardSales: { type: Number, default: 0, min: 0 },
  insuranceSales: { type: Number, default: 0, min: 0 },
  expenses: { type: Number, default: 0, min: 0 },
  discrepancy: { type: Number, default: 0 },
  verifiedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  notes: String,
  prescriptions: [{ type: Schema.Types.ObjectId, ref: 'Prescription' }],
  expenseRecords: [{ type: Schema.Types.ObjectId, ref: 'Expense' }]
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add virtuals for population
dailyCashSchema.virtual('prescriptionDetails', {
  ref: 'Prescription',
  localField: 'prescriptions',
  foreignField: '_id',
  justOne: false
});

dailyCashSchema.virtual('expenseDetails', {
  ref: 'Expense',
  localField: 'expenseRecords',
  foreignField: '_id',
  justOne: false
});

dailyCashSchema.virtual('verifiedByRef', {
  ref: 'User',
  localField: 'verifiedBy',
  foreignField: '_id',
  justOne: true
});

export const DailyCash = mongoose.models.DailyCash || 
  model<IDailyCash>('DailyCash', dailyCashSchema);
