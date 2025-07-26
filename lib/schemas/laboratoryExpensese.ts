// lib/schemas/expenseSchema.ts
import { z } from 'zod';

export const LaboratoryExpenseSchema = z.object({
  date: z.coerce.date(), // Handles both string and Date objects
  description: z.string().min(3, 'Description must be at least 3 characters'),
  amount: z.number().min(0, 'Amount must be positive'),
  type: z.enum(['normal', 'salary']),
  employeeId: z.string().optional().nullable() // Make it explicitly nullable
});

export type LaboratoryExpenseFormValues = z.infer<typeof LaboratoryExpenseSchema>;