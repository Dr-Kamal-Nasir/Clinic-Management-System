// app/api/pharmacy/prescriptions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Prescription } from '@/lib/models/Prescription';
import { MedicineStock } from '@/lib/models/MedicineStock';
import dbConnect from '@/lib/dbConnect';
import { getTokenPayload } from '@/lib/auth/jwt';
import { z } from 'zod';

const PrescriptionSchema = z.object({
  patientName: z.string().min(2),
  patientPhone: z.string().min(10),
  invoiceNumber: z.string().min(1),
  items: z.array(z.object({
    medicine: z.string(),
    quantity: z.number().min(1),
    discount: z.number().min(0).max(100).default(0),
    unitPrice: z.number().min(0)
  })),
  totalAmount: z.number().min(0),
  amountPaid: z.number().min(0),
  paymentMethod: z.enum(['cash', 'card', 'insurance']).default('cash'),
  status: z.enum(['pending', 'completed', 'cancelled']).default('pending')
});

export async function GET(req: NextRequest) {
  await dbConnect();
  const payload = await getTokenPayload(req);
  
  if (!payload || !(payload.role === 'pharmacy' || payload.role === 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const prescriptions = await Prescription.find()
      .populate('items.medicine', 'name batchNumber')
      .populate('issuedBy', 'name')
      .sort({ createdAt: -1 });

    return NextResponse.json({ 
      success: true,
      data: prescriptions 
    }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch prescriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prescriptions' }, 
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  await dbConnect();
  const payload = await getTokenPayload(req);
  
  if (!payload || !(payload.role === 'pharmacy' || payload.role === 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validation = PrescriptionSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(validation.error, { status: 400 });
    }

    // Process each item and update stock
    for (const item of validation.data.items) {
      const medicine = await MedicineStock.findById(item.medicine);
      if (!medicine) {
        return NextResponse.json(
          { error: `Medicine not found: ${item.medicine}` }, 
          { status: 404 }
        );
      }
      
      if (medicine.currentQuantity < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${medicine.name}` },
          { status: 400 }
        );
      }
      
      // Update stock quantity
      medicine.currentQuantity -= item.quantity;
      await medicine.save();
    }

    // Create prescription
    const newPrescription = await Prescription.create({
      ...validation.data,
      issuedBy: payload.id
    });

    return NextResponse.json(newPrescription, { status: 201 });
  } catch (error) {
    console.error('Failed to create prescription:', error);
    return NextResponse.json(
      { error: 'Failed to create prescription' }, 
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
