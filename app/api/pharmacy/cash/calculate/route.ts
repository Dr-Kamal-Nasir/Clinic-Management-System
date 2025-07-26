// app/api/pharmacy/cash/calculate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Prescription } from '@/lib/models/Prescription';
import { Expense } from '@/lib/models/Expense';
import { getTokenPayload } from '@/lib/auth/jwt';
import { startOfDay, endOfDay } from 'date-fns';

// Define types
interface TokenPayload {
  id: string;
  role: string;
}

interface DateRange {
  $gte: Date;
  $lte: Date;
}

interface PrescriptionQuery {
  paymentMethod: 'cash';
  status: 'completed';
  createdAt: DateRange;
}

interface ExpenseQuery {
  date: DateRange;
}

interface CalculationResult {
  cashSales: number;
  expenses: number;
}

export async function GET(req: NextRequest): Promise<NextResponse<CalculationResult | { error: string }>> {
  await dbConnect();
  const payload = await getTokenPayload(req) as TokenPayload | null;
  
  // Authorization check
  if (!payload || !(payload.role === 'admin' || payload.role === 'pharmacy')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    // Get today's cash prescriptions
    const prescriptionQuery: PrescriptionQuery = {
      paymentMethod: 'cash',
      status: 'completed',
      createdAt: { $gte: todayStart, $lte: todayEnd }
    };

    const cashPrescriptions = await Prescription.find(prescriptionQuery);
    const cashSales = cashPrescriptions.reduce((sum, prescription) => sum + prescription.amountPaid, 0);

    // Get today's expenses
    const expenseQuery: ExpenseQuery = {
      date: { $gte: todayStart, $lte: todayEnd }
    };

    const todayExpenses = await Expense.find(expenseQuery);
    const expenses = todayExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    return NextResponse.json({
      cashSales,
      expenses
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to calculate daily cash';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
