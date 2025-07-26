// app/api/pharmacy/dashboard/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Prescription, } from '@/lib/models/Prescription';
import { Expense } from '@/lib/models/Expense';
import {  MedicineStock } from '@/lib/models/MedicineStock';
import dbConnect from '@/lib/dbConnect';
import { getTokenPayload } from '@/lib/auth/jwt';

export async function GET(req: NextRequest) {
  await dbConnect();  
  const payload = await getTokenPayload(req);
  
  if (!payload || !(payload.role === 'admin' || payload.role === 'pharmacy')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get today's date at start and end of day
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Get sales data
    const [totalSales, cashSales, cardSales, insuranceSales] = await Promise.all([
      Prescription.aggregate([
        { $match: { createdAt: { $gte: todayStart, $lte: todayEnd }, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Prescription.aggregate([
        { $match: { createdAt: { $gte: todayStart, $lte: todayEnd }, status: 'completed', paymentMethod: 'cash' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Prescription.aggregate([
        { $match: { createdAt: { $gte: todayStart, $lte: todayEnd }, status: 'completed', paymentMethod: 'card' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Prescription.aggregate([
        { $match: { createdAt: { $gte: todayStart, $lte: todayEnd }, status: 'completed', paymentMethod: 'insurance' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ])
    ]);

    // Get expenses data
    const totalExpenses = await Expense.aggregate([
      { $match: { date: { $gte: todayStart, $lte: todayEnd } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Get inventory data
    const [inventoryValue, lowStockItems] = await Promise.all([
      MedicineStock.aggregate([
        { $group: { _id: null, total: { $sum: { $multiply: ['$currentQuantity', '$unitPrice'] } } } }
      ]),
      MedicineStock.countDocuments({
        $expr: { $lt: [{ $divide: ['$currentQuantity', '$originalQuantity'] }, 0.2] }
      })
    ]);

    return NextResponse.json({
      totalSales: totalSales[0]?.total || 0,
      cashSales: cashSales[0]?.total || 0,
      cardSales: cardSales[0]?.total || 0,
      insuranceSales: insuranceSales[0]?.total || 0,
      totalExpenses: totalExpenses[0]?.total || 0,
      inventoryValue: inventoryValue[0]?.total || 0,
      lowStockItems: lowStockItems || 0
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
