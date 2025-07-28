// lib/models/Prescription.ts
import mongoose, { Schema, Types } from 'mongoose';
import { IMedicineStock } from './MedicineStock';

export interface PrescriptionItem {
  medicine: Types.ObjectId | IMedicineStock;
  quantity: number;
  discount: number;
  unitPrice: number;
}

export interface IPrescription {
  _id: Types.ObjectId;
  patientName: string;
  patientPhone: string;
  invoiceNumber: string;
  items: PrescriptionItem[];
  totalAmount: number;
  amountPaid: number;
  paymentMethod: 'cash' | 'card' | 'insurance';
  status: 'pending' | 'completed' | 'cancelled';
  issuedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const prescriptionSchema = new Schema<IPrescription>({
  patientName: { type: String, required: true },
  patientPhone: { type: String, required: true },
  invoiceNumber: { type: String, required: true, unique: true },
  items: [{
    medicine: { type: Schema.Types.ObjectId, ref: 'MedicineStock', required: true },
    quantity: { type: Number, required: true, min: 1 },
    discount: { type: Number, default: 0, min: 0, max: 100 },
    unitPrice: { type: Number, required: true, min: 0 }
  }],
  totalAmount: { type: Number, required: true, min: 0 },
  amountPaid: { type: Number, required: true, min: 0 },
  paymentMethod: { 
    type: String, 
    required: true, 
    enum: ['cash', 'card', 'insurance'],
    default: 'cash'
  },
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'cancelled'],
    default: 'pending'
  },
  issuedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Add pre-save hook to update medicine stock
prescriptionSchema.pre('save', async function(next) {
  if (this.status === 'completed' && this.isModified('status')) {
    for (const item of this.items) {
      await mongoose.model('MedicineStock').findByIdAndUpdate(
        item.medicine,
        { $inc: { currentQuantity: -item.quantity } }
      );
    }
  }
  next();
});

export const Prescription = mongoose.models.Prescription ||
  mongoose.model<IPrescription>('Prescription', prescriptionSchema);
