// app/api/pharmacy/cash/calculate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Prescription } from '@/lib/models/Prescription';
import { Expense } from '@/lib/models/Expense';
import { getTokenPayload } from '@/lib/auth/jwt';
import { startOfDay, endOfDay } from 'date-fns';

export async function GET(req: NextRequest) {
  await dbConnect();
  const payload = await getTokenPayload(req);
  
  // Authorization check
  if (!payload || !(payload.role === 'admin' || payload.role === 'pharmacy')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    // Get today's cash prescriptions
    const cashPrescriptions = await Prescription.find({
      paymentMethod: 'cash',
      status: 'completed',
      createdAt: { $gte: todayStart, $lte: todayEnd }
    });

    const cashSales = cashPrescriptions.reduce((sum, prescription) => sum + prescription.amountPaid, 0);

    // Get today's expenses
    const todayExpenses = await Expense.find({
      date: { $gte: todayStart, $lte: todayEnd }
    });

    const expenses = todayExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    return NextResponse.json({
      cashSales,
      expenses
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to calculate daily cash' },
      { status: 500 }
    );
  }
}
