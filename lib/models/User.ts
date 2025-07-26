import mongoose, { Schema, Types, model } from 'mongoose';

export type UserRole = 'admin' | 'ceo' | 'laboratory' | 'pharmacy';

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  phone: string;
  role: UserRole;
  approved: boolean;
  avatar?: string;
  refreshTokens?: string[];
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['admin', 'ceo', 'laboratory', 'pharmacy'],
    default: 'laboratory'
  },
  approved: { type: Boolean, default: false },
  avatar: { type: String },
  refreshTokens: { type: [String], default: [] }
});

// Use named export
export const User = mongoose.models.User || model<IUser>('User', userSchema);
