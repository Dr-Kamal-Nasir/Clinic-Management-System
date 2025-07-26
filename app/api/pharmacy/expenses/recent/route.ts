// app/api/pharmacy/expenses/recent/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Expense } from '@/lib/models/Expense';
import dbConnect from '@/lib/dbConnect';
import { getTokenPayload } from '@/lib/auth/jwt';

export async function GET(req: NextRequest) {
  await dbConnect();
  const payload = await getTokenPayload(req);
  
  if (!payload || !(payload.role === 'admin' || payload.role === 'pharmacy')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get the 10 most recent expenses
    const recentExpenses = await Expense.find()
      .sort({ date: -1 })
      .limit(10)
      .lean();

    return NextResponse.json(recentExpenses);
  } catch (error) {
    console.error('Error fetching recent expenses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent expenses' },
      { status: 500 }
    );
  }
}
