// schemas/userSchema.ts
import { z } from 'zod';

export const UserRoleEnum = ['admin', 'ceo', 'laboratory', 'pharmacy'] as const;
export type UserRole = (typeof UserRoleEnum)[number];

// Base schema with common fields
const BaseUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^[0-9+]+$/, 'Invalid phone number format'),
  role: z.enum(UserRoleEnum),
  approved: z.boolean().default(false),
});

// Schema for creating users (password required)
export const CreateUserSchema = BaseUserSchema.extend({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number')
    .regex(/[!@#$%^&*]/, 'Must contain at least one special character'),
});

// Schema for updating users (password optional)
export const UpdateUserSchema = BaseUserSchema.extend({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number')
    .regex(/[!@#$%^&*]/, 'Must contain at least one special character')
    .optional(),
});

// Keep the original for backward compatibility
export const UserSchema = CreateUserSchema;

export type UserFormValues = z.infer<typeof UserSchema>;