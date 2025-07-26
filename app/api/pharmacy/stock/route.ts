//app/api/pharmacy/stock/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { MedicineStock } from '@/lib/models/MedicineStock';
import dbConnect from '@/lib/dbConnect';
import { getTokenPayload } from '@/lib/auth/jwt';
import { z } from 'zod';

const MedicineSchema = z.object({
  name: z.string().min(2),
  batchNumber: z.string().min(1),
  expiryDate: z.coerce.date(),
  originalQuantity: z.number().min(0),
  currentQuantity: z.number().min(0).optional(),
  unitPrice: z.number().min(0),
  sellingPrice: z.number().min(0),
  supplier: z.string().min(2),
});

export async function GET(req: NextRequest) {
  await dbConnect();
  const payload = await getTokenPayload(req);
  
  if (!payload || !(payload.role === 'admin' || payload.role === 'pharmacy')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const skip = (page - 1) * limit;
  const search = searchParams.get('search') || '';

  try {
    const query = search ? {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { batchNumber: { $regex: search, $options: 'i' } },
        { supplier: { $regex: search, $options: 'i' } }
      ]
    } : {};

    const [stocks, total] = await Promise.all([
      MedicineStock.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      MedicineStock.countDocuments(query)
    ]);

    return NextResponse.json({
      data: stocks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch medicine stock' }, 
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  await dbConnect();
  const payload = await getTokenPayload(req);
  
  if (!payload || !(payload.role === 'admin' || payload.role === 'pharmacy')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validation = MedicineSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(validation.error, { status: 400 });
    }

    // Check for duplicate batch number
    const existingBatch = await MedicineStock.findOne({ 
      batchNumber: body.batchNumber 
    });
    
    if (existingBatch) {
      return NextResponse.json(
        { error: 'Batch number already exists' }, 
        { status: 400 }
      );
    }

       // For new stock, currentQuantity = originalQuantity
    const data = validation.data;
    const newStock = await MedicineStock.create({
      ...data,
      currentQuantity: data.originalQuantity
    });
    
    return NextResponse.json(newStock, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create medicine stock' }, 
      { status: 500 }
    );
  }
}