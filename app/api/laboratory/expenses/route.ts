import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { LaboratoryExpense } from '@/lib/models/LaboratoryExpenses';
import {LaboratoryRecord} from '@/lib/models/LaboratoryRecord';
import { getTokenPayload } from '@/lib/auth/jwt';
import { z } from 'zod';

const expenseSchema = z.object({
  date: z.coerce.date(),
  description: z.string().min(1, "Description is required"),
  amount: z.number().min(0, "Amount must be positive"),
  expenseType: z.enum(['normal', 'doctor_salary']),
  doctorName: z.string().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  percentage: z.number().min(0).max(100).optional(),
});

export async function GET(req: NextRequest) {
  await dbConnect();
  const payload = await getTokenPayload(req);
  
  if (!payload || !['admin', 'laboratory'].includes(payload.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const expenseType = searchParams.get('type');
    
    let query: any = {};
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (expenseType) {
      query.expenseType = expenseType;
    }

    const expenses = await LaboratoryExpense.find(query)
      .sort({ date: -1 })
      .populate('recordedBy', 'name');
      
    return NextResponse.json(expenses);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  await dbConnect();
  const payload = await getTokenPayload(req);
  
  if (!payload || !['admin', 'laboratory'].includes(payload.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validation = expenseSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(validation.error, { status: 400 });
    }

    let amount = validation.data.amount;
    let calculatedFromRecords = 0;

    if (validation.data.expenseType === 'doctor_salary' && 
        validation.data.fromDate && 
        validation.data.toDate) {
      
      const records = await LaboratoryRecord.find({
        date: {
          $gte: new Date(validation.data.fromDate),
          $lte: new Date(validation.data.toDate)
        }
      });
      
      calculatedFromRecords = records.reduce((sum, record) => sum + record.amountPaid, 0);
      
      if (validation.data.percentage) {
        amount = calculatedFromRecords * (validation.data.percentage / 100);
      } else {
        amount = calculatedFromRecords;
      }
    }

    const newExpense = new LaboratoryExpense({
      ...validation.data,
      amount,
      calculatedFromRecords: validation.data.expenseType === 'doctor_salary' ? calculatedFromRecords : undefined,
      recordedBy: payload.id
    });

    await newExpense.save();

    return NextResponse.json(
      { 
        message: 'Expense created successfully', 
        expense: newExpense
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create expense' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  await dbConnect();
  const payload = await getTokenPayload(req);
  
  if (!payload || !['admin', 'laboratory'].includes(payload.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const body = await req.json();
    const validation = expenseSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(validation.error, { status: 400 });
    }

    if (!id) {
      return NextResponse.json({ error: 'Expense ID is required' }, { status: 400 });
    }

    const updatedExpense = await LaboratoryExpense.findByIdAndUpdate(
      id,
      validation.data,
      { new: true }
    );

    if (!updatedExpense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    return NextResponse.json(
      { message: 'Expense updated successfully', expense: updatedExpense }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update expense' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  await dbConnect();
  const payload = await getTokenPayload(req);
  
  if (!payload || !['admin', 'laboratory'].includes(payload.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Expense ID is required' }, { status: 400 });
    }

    const deletedExpense = await LaboratoryExpense.findByIdAndDelete(id);

    if (!deletedExpense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    return NextResponse.json(
      { message: 'Expense deleted successfully' }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete expense' },
      { status: 500 }
    );
  }
}
