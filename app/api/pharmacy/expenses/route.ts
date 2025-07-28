//app/api/pharmacy/expneses/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { Expense } from '@/lib/models/Expense';
import dbConnect from '@/lib/dbConnect';
import { getTokenPayload } from '@/lib/auth/jwt';
import { z } from 'zod';

const ExpenseSchema = z.object({
  date: z.coerce.date(),
  amount: z.number().min(0),
  category: z.string(),
  description: z.string(),
});

// GET handler to fetch expenses
export async function GET(req: NextRequest) {
  await dbConnect();
  const payload = await getTokenPayload(req);
  
  // Authorization check
  if (!payload || !(payload.role === 'admin' || payload.role === 'pharmacy')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    let query = {};
    
    if (startDate && endDate) {
      query = {
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    const expenses = await Expense.find(query)
      .sort({ date: -1 })
      .populate('recordedByRef', 'name');
      
    return NextResponse.json(expenses);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
      { status: 500 }
    );
  }
}

// POST handler to create new expense
export async function POST(req: NextRequest) {
  await dbConnect();
  const payload = await getTokenPayload(req);
  
  // Authorization check
  if (!payload || !(payload.role === 'admin' || payload.role === 'pharmacy')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validation = ExpenseSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(validation.error, { status: 400 });
    }

    // Create and save new expense
    const newExpense = new Expense({
      ...validation.data,
      recordedBy: payload.id
    });

    await newExpense.save();

    return NextResponse.json(
      { message: 'Expense recorded successfully', expense: newExpense },
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

// PUT handler to update expense
export async function PUT(req: NextRequest) {
  await dbConnect();
  const payload = await getTokenPayload(req);
  
  // Authorization check
  if (!payload || !(payload.role === 'admin' || payload.role === 'pharmacy')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validation = ExpenseSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(validation.error, { status: 400 });
    }

    const { _id, ...expenseData } = body;

    if (!_id) {
      return NextResponse.json({ error: 'Expense ID is required' }, { status: 400 });
    }

    const updatedExpense = await Expense.findByIdAndUpdate(
      _id,
      expenseData,
      { new: true }
    ).populate('recordedByRef', 'name');

    if (!updatedExpense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    return NextResponse.json(
      { message: 'Expense updated successfully', expense: updatedExpense }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Sever error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE handler to delete expense
export async function DELETE(req: NextRequest) {
  await dbConnect();
  const payload = await getTokenPayload(req);
  
  // Authorization check
  if (!payload || !(payload.role === 'admin' || payload.role === 'pharmacy')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Expense ID is required' }, { status: 400 });
    }

    const deletedExpense = await Expense.findByIdAndDelete(id);

    if (!deletedExpense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    return NextResponse.json(
      { message: 'Expense deleted successfully' }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Sever error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
