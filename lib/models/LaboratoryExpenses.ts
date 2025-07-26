//lib/models/LaboratoryExpenses.ts

import mongoose, { Document, Schema, Model } from 'mongoose';
import { IUser } from './User';

export type ExpenseType = 'normal' | 'doctor_salary';

export interface ILaboratoryExpense extends Document {
  date: Date;
  description: string;
  amount: number;
  expenseType: ExpenseType;
  doctorName?: string;
  fromDate?: Date;
  toDate?: Date;
  percentage?: number; // New field for doctor's percentage
  calculatedFromRecords?: number; // New field to store the base amount
  recordedBy: mongoose.Types.ObjectId | IUser;
  createdAt: Date;
  updatedAt: Date;
}

const LaboratoryExpenseSchema = new Schema<ILaboratoryExpense>(
  {
    date: { type: Date, required: true },
    description: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    expenseType: { 
      type: String, 
      required: true,
      enum: ['normal', 'doctor_salary'] 
    },
    doctorName: { type: String },
    fromDate: { type: Date },
    toDate: { type: Date },
    percentage: { type: Number, min: 0, max: 100 }, // New field
    calculatedFromRecords: { type: Number }, // New field
    recordedBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
  },
  { timestamps: true }
);

export const LaboratoryExpense: Model<ILaboratoryExpense> = 
  mongoose.models.LaboratoryExpense || 
  mongoose.model<ILaboratoryExpense>('LaboratoryExpense', LaboratoryExpenseSchema);
