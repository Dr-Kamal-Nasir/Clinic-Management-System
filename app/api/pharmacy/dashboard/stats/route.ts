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
    // Get date range from query params
    const searchParams = req.nextUrl.searchParams;
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');
    
    // Validate and parse dates
    const dateStart = fromDate ? new Date(fromDate) : new Date();
    dateStart.setHours(0, 0, 0, 0);
    
    const dateEnd = toDate ? new Date(toDate) : new Date();
    dateEnd.setHours(23, 59, 59, 999);

    if (isNaN(dateStart.getTime()) || isNaN(dateEnd.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Get sales data
    const [totalSales, cashSales, cardSales, insuranceSales] = await Promise.all([
      Prescription.aggregate([
        { $match: { createdAt: { $gte: dateStart, $lte: dateEnd }, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Prescription.aggregate([
        { $match: { createdAt: { $gte: dateStart, $lte: dateEnd }, status: 'completed', paymentMethod: 'cash' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Prescription.aggregate([
        { $match: { createdAt: { $gte: dateStart, $lte: dateEnd }, status: 'completed', paymentMethod: 'card' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Prescription.aggregate([
        { $match: { createdAt: { $gte: dateStart, $lte: dateEnd }, status: 'completed', paymentMethod: 'insurance' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ])
    ]);

    // Get expenses data
    const totalExpenses = await Expense.aggregate([
      { $match: { date: { $gte: dateStart, $lte: dateEnd } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Get inventory data with error handling
    let inventoryValue = 0;
    let lowStockItems = 0;
    
    try {
      const [inventoryResult, lowStockResult] = await Promise.all([
        MedicineStock.aggregate([
          { $match: { currentQuantity: { $gt: 0 } } },
          { $group: { _id: null, total: { $sum: { $multiply: ['$currentQuantity', '$unitPrice'] } } } }
        ]),
        MedicineStock.countDocuments({
          $and: [
            { currentQuantity: { $gt: 0 } },
            { originalQuantity: { $gt: 0 } },
            { 
              $expr: { 
                $lt: [
                  { $divide: ['$currentQuantity', '$originalQuantity'] },
                  0.2 
                ] 
              } 
            }
          ]
        })
      ]);
      
      inventoryValue = inventoryResult[0]?.total || 0;
      lowStockItems = lowStockResult || 0;
    } catch (err) {
      console.error('Inventory stats error:', err);
    }

    return NextResponse.json({
      totalSales: totalSales[0]?.total || 0,
      cashSales: cashSales[0]?.total || 0,
      cardSales: cardSales[0]?.total || 0,
      insuranceSales: insuranceSales[0]?.total || 0,
      totalExpenses: totalExpenses[0]?.total || 0,
      inventoryValue: inventoryValue || 0,
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
