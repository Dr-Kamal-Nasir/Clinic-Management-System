//lib/models/expense.

import mongoose, { Schema, Types, model } from 'mongoose';

export interface IExpense {
  _id: Types.ObjectId;
  date: Date;
  amount: number;
  category: string;
  description: string;
  recordedBy: Types.ObjectId;
}

const expenseSchema = new Schema<IExpense>({
  date: { 
    type: Date, 
    required: true, 
    default: Date.now 
  },
  amount: { 
    type: Number, 
    required: true, 
    min: 0,
    default: 0 // Add default value
  },
  category: { 
    type: String, 
    required: true,
    default: 'Other' // Add default category
  },
  description: { 
    type: String, 
    required: true,
    default: '' // Add default description
  },
  recordedBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }
}, { 
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: (doc, ret) => {
      ret._id = ret._id.toString() as any;
      return ret;
    }
  }
});


// Virtual for population
expenseSchema.virtual('recordedByRef', {
  ref: 'User',
  localField: 'recordedBy',
  foreignField: '_id',
  justOne: true
});

export const Expense = mongoose.models.Expense || 
  model<IExpense>('Expense', expenseSchema);
