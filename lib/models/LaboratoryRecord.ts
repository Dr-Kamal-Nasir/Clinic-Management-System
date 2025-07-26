//lib/model/LaboratoryRecords.ts

import mongoose, { Document, Schema, Model } from 'mongoose';
import { IUser } from './User';

export interface ILaboratoryRecord extends Document {
  date: Date;
  patientName: string;
  invoiceNumber: string;
  testType: string;
  phoneNumber?: string;
  amountCharged: number;
  amountPaid: number;
  recordedBy: mongoose.Types.ObjectId | IUser;
  createdAt: Date;
  updatedAt: Date;
}

const LaboratoryRecordSchema = new Schema<ILaboratoryRecord>(
  {
    date: { type: Date, required: true },
    patientName: { type: String, required: true },
    invoiceNumber: { 
      type: String, 
      required: true, 
      unique: true
    },
    testType: { type: String, required: true },
    phoneNumber: { type: String },
    amountCharged: { type: Number, required: true, min: 0 },
    amountPaid: { type: Number, required: true, min: 0 },
    recordedBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
  },
  { timestamps: true }
);

// Add index for date field
LaboratoryRecordSchema.index({ date: 1 });

// Handle duplicate key errors
LaboratoryRecordSchema.post('save', function (error: any, doc: ILaboratoryRecord, next: any) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    next(new Error('Invoice number must be unique'));
  } else {
    next(error);
  }
});

// Export both the model and interface
export const LaboratoryRecord: Model<ILaboratoryRecord> = 
  mongoose.models.LaboratoryRecord || 
  mongoose.model<ILaboratoryRecord>('LaboratoryRecord', LaboratoryRecordSchema);

