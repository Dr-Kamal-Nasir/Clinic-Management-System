//app/api/pharmacy/stock/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { MedicineStock } from "@/lib/models/MedicineStock";
import dbConnect from "@/lib/dbConnect";
import { getTokenPayload } from "@/lib/auth/jwt";
import { z } from "zod";

const MedicineSchema = z.object({
  name: z.string().min(2).optional(),
  batchNumber: z.string().min(1).optional(),
  expiryDate: z.coerce.date().optional(),
  originalQuantity: z.number().min(0).optional(), // Not editable
  currentQuantity: z.number().min(0).optional(), // Editable for stock adjustment
  additionalQuantity: z.number().min(0).optional(), // New stock to add
  newUnitPrice: z.number().min(0).optional(), // Price for new stock
  newSellingPrice: z.number().min(0).optional(), // Price for new stock
  supplier: z.string().min(2).optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  const payload = await getTokenPayload(req);

  if (!payload || !(payload.role === "admin" || payload.role === "pharmacy")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validation = MedicineSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(validation.error, { status: 400 });
    }

    const existingStock = await MedicineStock.findById(params.id);
    if (!existingStock) {
      return NextResponse.json(
        { error: "Medicine not found" },
        { status: 404 }
      );
    }

    const updateData: any = {};

    // Handle additional stock
    if (
      validation.data.additionalQuantity &&
      validation.data.additionalQuantity > 0
    ) {
      const additionalQty = validation.data.additionalQuantity;

      // If new prices are provided for additional stock
      if (validation.data.newUnitPrice && validation.data.newSellingPrice) {
        // Create a new batch for the additional stock with new prices
        const newBatch = await MedicineStock.create({
          name: existingStock.name,
          batchNumber: `${existingStock.batchNumber}-${Date.now()}`,
          expiryDate: validation.data.expiryDate || existingStock.expiryDate,
          originalQuantity: additionalQty,
          currentQuantity: additionalQty,
          unitPrice: validation.data.newUnitPrice,
          sellingPrice: validation.data.newSellingPrice,
          supplier: validation.data.supplier || existingStock.supplier,
        });

        // Update existing stock with the remaining fields
        updateData.currentQuantity =
          validation.data.currentQuantity ?? existingStock.currentQuantity;
        if (validation.data.expiryDate)
          updateData.expiryDate = validation.data.expiryDate;
        if (validation.data.supplier)
          updateData.supplier = validation.data.supplier;

        const updatedStock = await MedicineStock.findByIdAndUpdate(
          params.id,
          updateData,
          { new: true }
        );

        return NextResponse.json({
          updatedStock,
          newBatch,
        });
      } else {
        // Add to existing batch without price change
        updateData.originalQuantity =
          existingStock.originalQuantity + additionalQty;
        updateData.currentQuantity =
          existingStock.currentQuantity + additionalQty;
      }
    }

    // Update other fields
    if (validation.data.currentQuantity !== undefined) {
      updateData.currentQuantity = validation.data.currentQuantity;
    }
    if (validation.data.expiryDate)
      updateData.expiryDate = validation.data.expiryDate;
    if (validation.data.supplier)
      updateData.supplier = validation.data.supplier;

    const updatedStock = await MedicineStock.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true }
    );

    return NextResponse.json(updatedStock);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update medicine stock" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  const payload = await getTokenPayload(req);

  // Only admin can delete
  if (!payload || payload.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const deletedStock = await MedicineStock.findByIdAndDelete(params.id);

    if (!deletedStock) {
      return NextResponse.json(
        { error: "Medicine not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete medicine stock" },
      { status: 500 }
    );
  }
}
