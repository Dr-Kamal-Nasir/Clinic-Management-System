// lib/schemas/laboratoryRecordSchema.ts
import { z } from 'zod';

export const LaboratoryRecordSchema = z.object({
  patientName: z.string().min(1, "Patient name is required"),
  testType: z.string().min(1, "Test type is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  amountCharged: z.number().min(0, "Amount must be positive"),
  amountPaid: z.number().min(0, "Amount must be positive"),
  discount: z.number().min(0).default(0),
  paymentStatus: z.enum(['paid', 'unpaid', 'partial']).default('unpaid'),
  date: z.date().default(new Date()),
});

// Use this type for form values
export type LaboratoryRecordFormValues = z.infer<typeof LaboratoryRecordSchema>;

// Use this type for API input (if needed)
export type LaboratoryRecordInput = LaboratoryRecordFormValues;
