// app/api/pharmacy/inventory/low-stock/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { MedicineStock } from '@/lib/models/MedicineStock';
import dbConnect from '@/lib/dbConnect';
import { getTokenPayload } from '@/lib/auth/jwt';

export async function GET(req: NextRequest) {
  await dbConnect();
  const payload = await getTokenPayload(req);
  
  if (!payload || !(payload.role === 'admin' || payload.role === 'pharmacy')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get medicines with less than 20% stock remaining
    const lowStockItems = await MedicineStock.find({
      $expr: {
        $lt: [
          { $divide: ['$currentQuantity', '$originalQuantity'] },
          0.2 // 20% threshold
        ]
      }
    })
    .select('name batchNumber currentQuantity originalQuantity')
    .lean();

    return NextResponse.json(lowStockItems.map(item => ({
      ...item,
      remainingPercentage: (item.currentQuantity / item.originalQuantity) * 100
    })));
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch low stock items' },
      { status: 500 }
    );
  }
}
