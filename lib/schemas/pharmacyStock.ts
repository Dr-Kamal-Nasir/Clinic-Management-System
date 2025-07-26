import { z } from "zod";

// Define the payment status options as a Zod enum
export const PaymentStatusEnum = z.enum(["paid", "pending", "partial"]);
export type PaymentStatus = z.infer<typeof PaymentStatusEnum>;

export const PharmacyStockSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  batchNumber: z.string().min(1, "Batch number is required"),
  expiryDate: z.date({
    error: "Expiry date is required",
  }),
  quantity: z.coerce.number().min(0, "Quantity must be at least 0"),
  unitPrice: z.coerce.number().min(0, "Unit price must be at least 0"),
  sellingPrice: z.coerce.number().min(0, "Selling price must be at least 0"),
  supplier: z.string().min(2, "Supplier must be at least 2 characters"),
  description: z.string().optional(),
});

export type PharmacyStockFormValues = z.infer<typeof PharmacyStockSchema>;
