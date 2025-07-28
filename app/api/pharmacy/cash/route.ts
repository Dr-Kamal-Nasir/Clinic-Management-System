// app/api/pharmacy/cash/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { DailyCash } from '@/lib/models/DailyCash';
import { Prescription } from '@/lib/models/Prescription';
import { Expense } from '@/lib/models/Expense';
import dbConnect from '@/lib/dbConnect';
import { getTokenPayload } from '@/lib/auth/jwt';
import { z } from 'zod';
import { startOfDay, endOfDay } from 'date-fns';

const DailyCashSchema = z.object({
  date: z.coerce.date(),
  openingBalance: z.number().min(0),
  closingBalance: z.number().min(0),
  notes: z.string().optional()
});

// GET handler to fetch cash records
export async function GET(req: NextRequest) {
  await dbConnect();
  
  try {
    const records = await DailyCash.find()
      .sort({ date: -1 })
      .populate('verifiedBy', 'name');
      
    return NextResponse.json(records);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch cash records' },
      { status: 500 }
    );
  }
}

// POST handler to create new cash record
export async function POST(req: NextRequest) {
  await dbConnect();
  const payload = await getTokenPayload(req);
  
  // Authorization check
  if (!payload || !(payload.role === 'admin' || payload.role === 'pharmacy')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validation = DailyCashSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(validation.error, { status: 400 });
    }

    const { date, openingBalance, closingBalance, notes } = validation.data;
    const todayStart = startOfDay(date);
    const todayEnd = endOfDay(date);

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

    // Calculate discrepancy
    const expectedCash = openingBalance + cashSales - expenses;
    const discrepancy = closingBalance - expectedCash;

    // Create and save new record
    const newDailyCash = new DailyCash({
      date,
      openingBalance,
      closingBalance,
      cashSales,
      expenses,
      discrepancy,
      notes,
      verifiedBy: payload.id,
      prescriptions: cashPrescriptions.map(p => p._id),
      expenseRecords: todayExpenses.map(e => e._id)
    });

    await newDailyCash.save();

    return NextResponse.json(
      { message: 'Cash record saved successfully', record: newDailyCash },
      { status: 201 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Sever error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
