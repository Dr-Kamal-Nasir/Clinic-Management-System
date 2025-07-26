// schemas/userSchema.ts
import { z } from 'zod';

export const UserRoleEnum = ['admin', 'ceo', 'laboratory', 'pharmacy'] as const;
export type UserRole = (typeof UserRoleEnum)[number];

export const UserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(1, "Phone is required"),
  password: z.string().min(6).optional(),
  role: z.enum(UserRoleEnum),
  approved: z.boolean().default(false),
});

export type UserFormValues = z.infer<typeof UserSchema>;