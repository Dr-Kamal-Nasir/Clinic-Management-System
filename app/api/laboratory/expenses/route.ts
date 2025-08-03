import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { LaboratoryExpense } from '@/lib/models/LaboratoryExpenses';
import { LaboratoryRecord } from '@/lib/models/LaboratoryRecord';
import { getTokenPayload } from '@/lib/auth/jwt';
import { z } from 'zod';

// Define types and schemas
type ExpenseType = 'normal' | 'doctor_salary';

interface ExpenseQuery {
  date?: {
    $gte: Date;
    $lte: Date;
  };
  expenseType?: ExpenseType;
  recordedBy?: string;
}

interface TokenPayload {
  id: string;
  role: string;
}

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
  try {
    console.log('Connecting to database for expenses...');
    await dbConnect();
    const payload = await getTokenPayload(req) as TokenPayload | null;
    
    if (!payload || !['admin', 'laboratory'].includes(payload.role)) {
      console.log('Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Successfully connected to database and validated token');
    console.log('Request params:', Object.fromEntries(new URL(req.url).searchParams.entries()));
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const expenseType = searchParams.get('type') as ExpenseType | null;
    
    const query: ExpenseQuery = {};
    
    // Only add date filter if both dates are provided and valid
    if (startDate && endDate && startDate.trim() !== '' && endDate.trim() !== '') {
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      
      // Check if dates are valid
      if (!isNaN(startDateObj.getTime()) && !isNaN(endDateObj.getTime())) {
        query.date = {
          $gte: startDateObj,
          $lte: endDateObj
        };
      }
    }

    if (expenseType && ['normal', 'doctor_salary'].includes(expenseType)) {
      query.expenseType = expenseType;
    }

    const expenses = await LaboratoryExpense.find(query)
      .sort({ date: -1 })
      .populate('recordedBy', 'name');
    
    // Ensure we always return an array
    const expensesArray = Array.isArray(expenses) ? expenses : [];
      
    return NextResponse.json(expensesArray);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch expenses';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  await dbConnect();
  const payload = await getTokenPayload(req) as TokenPayload | null;
  
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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create expense';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  await dbConnect();
  const payload = await getTokenPayload(req) as TokenPayload | null;
  
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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update expense';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  await dbConnect();
  const payload = await getTokenPayload(req) as TokenPayload | null;
  
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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete expense';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
