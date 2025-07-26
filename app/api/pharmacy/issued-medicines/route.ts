// app/api/pharmacy/issued-medicines/route.ts
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
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Both startDate and endDate are required' },
        { status: 400 }
      );
    }

    // Find medicines that were issued (quantity decreased) within the date range
    const issuedMedicines = await MedicineStock.find({
      'history.date': {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      },
      'history.type': 'issued'
    }).lean();

    // Process the data to show quantity changes
    const result = issuedMedicines.map(medicine => {
      const relevantHistory = medicine.history.filter((entry: { type: string; date: string | number | Date; }) => 
        entry.type === 'issued' && 
        new Date(entry.date) >= new Date(startDate) && 
        new Date(entry.date) <= new Date(endDate)
      );

      const totalIssued = relevantHistory.reduce((sum: any, entry: { quantity: any; }) => sum + entry.quantity, 0);

      return {
        ...medicine,
        issuedQuantity: totalIssued,
        remainingQuantity: medicine.currentQuantity
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching issued medicines:', error);
    return NextResponse.json(
      { error: 'Failed to fetch issued medicines' },
      { status: 500 }
    );
  }
}
