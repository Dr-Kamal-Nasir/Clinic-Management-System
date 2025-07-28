// app/api/pharmacy/stock/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { MedicineStock } from "@/lib/models/MedicineStock";
import dbConnect from "@/lib/dbConnect";
import { getTokenPayload } from "@/lib/auth/jwt";
import { z } from "zod";

// Define types
interface TokenPayload {
  id: string;
  role: string;
}

interface MedicineUpdateData {
  name?: string;
  batchNumber?: string;
  expiryDate?: Date;
  originalQuantity?: number;
  currentQuantity?: number;
  unitPrice?: number;
  sellingPrice?: number;
  supplier?: string;
}

interface NewBatchData extends MedicineUpdateData {
  name: string;
  batchNumber: string;
  originalQuantity: number;
  currentQuantity: number;
}

interface ResponseData {
  updatedStock?: MedicineUpdateData;
  newBatch?: NewBatchData;
  success?: boolean;
  error?: string;
}

const MedicineSchema = z.object({
  name: z.string().min(2).optional(),
  batchNumber: z.string().min(1).optional(),
  expiryDate: z.coerce.date().optional(),
  originalQuantity: z.number().min(0).optional(),
  currentQuantity: z.number().min(0).optional(),
  additionalQuantity: z.number().min(0).optional(),
  newUnitPrice: z.number().min(0).optional(),
  newSellingPrice: z.number().min(0).optional(),
  supplier: z.string().min(2).optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ResponseData>> {
  await dbConnect();
  const payload = await getTokenPayload(req) as TokenPayload | null;

  if (!payload || !(payload.role === "admin" || payload.role === "pharmacy")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const validation = MedicineSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.message }, { status: 400 });
    }

    const existingStock = await MedicineStock.findById(id);
    if (!existingStock) {
      return NextResponse.json(
        { error: "Medicine not found" },
        { status: 404 }
      );
    }

    const updateData: MedicineUpdateData = {};

    // Handle additional stock
    if (validation.data.additionalQuantity && validation.data.additionalQuantity > 0) {
      const additionalQty = validation.data.additionalQuantity;

      if (validation.data.newUnitPrice && validation.data.newSellingPrice) {
        const newBatchData: NewBatchData = {
          name: existingStock.name,
          batchNumber: `${existingStock.batchNumber}-${Date.now()}`,
          expiryDate: validation.data.expiryDate || existingStock.expiryDate,
          originalQuantity: additionalQty,
          currentQuantity: additionalQty,
          unitPrice: validation.data.newUnitPrice,
          sellingPrice: validation.data.newSellingPrice,
          supplier: validation.data.supplier || existingStock.supplier,
        };

        const newBatch = await MedicineStock.create(newBatchData);

        // Update existing stock
        updateData.currentQuantity = validation.data.currentQuantity ?? existingStock.currentQuantity;
        if (validation.data.expiryDate) updateData.expiryDate = validation.data.expiryDate;
        if (validation.data.supplier) updateData.supplier = validation.data.supplier;

        const updatedStock = await MedicineStock.findByIdAndUpdate(
          id,
          updateData,
          { new: true }
        );

        return NextResponse.json({
          updatedStock,
          newBatch,
        });
      } else {
        updateData.originalQuantity = existingStock.originalQuantity + additionalQty;
        updateData.currentQuantity = existingStock.currentQuantity + additionalQty;
      }
    }

    // Update other fields
    if (validation.data.currentQuantity !== undefined) {
      updateData.currentQuantity = validation.data.currentQuantity;
    }
    if (validation.data.expiryDate) updateData.expiryDate = validation.data.expiryDate;
    if (validation.data.supplier) updateData.supplier = validation.data.supplier;

    const updatedStock = await MedicineStock.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    return NextResponse.json({ updatedStock });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to update medicine stock";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ResponseData>> {
  await dbConnect();
  const payload = await getTokenPayload(req) as TokenPayload | null;

  // Only admin can delete
  if (!payload || payload.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const deletedStock = await MedicineStock.findByIdAndDelete(id);

    if (!deletedStock) {
      return NextResponse.json(
        { error: "Medicine not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to delete medicine stock";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
};