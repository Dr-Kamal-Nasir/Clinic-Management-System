// app/api/laboratory/expenses/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { LabExpense } from '@/lib/models/LaboratoryExpenses';
import dbConnect from '@/lib/dbConnect';
import { getTokenPayload } from '@/lib/auth/jwt';
import { LaboratoryExpenseSchema } from '@/lib/schemas/laboratoryExpensese';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();
  
  try {
    const payload = await getTokenPayload(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin and laboratory can update
    if (!['admin', 'laboratory'].includes(payload.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const validation = LaboratoryExpenseSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(validation.error, { status: 400 });
    }
    
    const expense = await LabExpense.findByIdAndUpdate(
      params.id,
      validation.data,
      { new: true }
    );
    
    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }
    
    return NextResponse.json(expense);
  } catch (error) {
    console.error('Failed to update expense:', error);
    return NextResponse.json(
      { error: 'Failed to update expense' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();
  
  try {
    const payload = await getTokenPayload(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin can delete
    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const expense = await LabExpense.findByIdAndDelete(params.id);
    
    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete expense:', error);
    return NextResponse.json(
      { error: 'Failed to delete expense' }, 
      { status: 500 }
    );
  }
}
