// app/api/laboratory/Record/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { LaboratoryRecord } from '@/lib/models/LaboratoryRecord';
import { getTokenPayload } from '@/lib/auth/jwt';
import { z } from 'zod';

// Define types
interface TokenPayload {
  id: string;
  role: string;
}

interface DateRangeQuery {
  $gte: Date;
  $lte: Date;
}

interface RecordQuery {
  date?: DateRangeQuery;
  recordedBy?: string;
}

type RecordData = z.infer<typeof recordSchema>;

const recordSchema = z.object({
  date: z.coerce.date(),
  patientName: z.string().min(1, "Patient name is required"),
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  testType: z.string().min(1, "Test type is required"),
  phoneNumber: z.string().optional(),
  amountCharged: z.number().min(0, "Amount charged must be positive"),
  amountPaid: z.number().min(0, "Amount paid must be positive"),
});

interface ValidateRequestResult {
  error?: NextResponse;
  payload?: TokenPayload;
}

const validateRequest = async (req: NextRequest): Promise<ValidateRequestResult> => {
  const payload = await getTokenPayload(req) as TokenPayload | null;
  if (!payload || !['admin', 'laboratory'].includes(payload.role)) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  return { payload };
};

export async function GET(req: NextRequest) {
  try {
    console.log('Connecting to database...');
    await dbConnect();
    
    const { error } = await validateRequest(req);
    if (error) return error;
    console.log('Database connection and auth validation successful');

    const { searchParams } = new URL(req.url);
    console.log('Request params:', Object.fromEntries(searchParams.entries()));
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    const query: RecordQuery = {};
    
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

    const records = await LaboratoryRecord.find(query)
      .sort({ date: -1 })
      .populate('recordedBy', 'name');
    
    // Ensure we always return an array
    const recordsArray = Array.isArray(records) ? records : [];
      
    return NextResponse.json(recordsArray);
  } catch (err: unknown) {
    console.error('Failed to fetch records:', err);
    const errorMessage = err instanceof Error ? err.message : 'Failed to fetch records';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  await dbConnect();
  
  const { error, payload } = await validateRequest(req);
  if (error) return error;

  try {
    const body = await req.json();
    const validation = recordSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(validation.error, { status: 400 });
    }

    const newRecord = new LaboratoryRecord({
      ...validation.data,
      recordedBy: payload?.id
    });

    await newRecord.save();

    return NextResponse.json(
      { message: 'Record created successfully', record: newRecord },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error('Error creating record:', err);
    const errorMessage = err instanceof Error ? err.message : 'Failed to create record';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  await dbConnect();
  
  const { error, payload } = await validateRequest(req);
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Record ID is required' }, { status: 400 });
    }

    const body = await req.json();
    const validation = recordSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(validation.error, { status: 400 });
    }

    const updatedRecord = await LaboratoryRecord.findByIdAndUpdate(
      id,
      validation.data,
      { new: true }
    ).populate('recordedBy', 'name');

    if (!updatedRecord) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    return NextResponse.json(
      { message: 'Record updated successfully', record: updatedRecord }
    );
  } catch (err: unknown) {
    console.error('Error updating record:', err);
    const errorMessage = err instanceof Error ? err.message : 'Failed to update record';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  await dbConnect();
  
  const { error } = await validateRequest(req);
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Record ID is required' }, { status: 400 });
    }

    const deletedRecord = await LaboratoryRecord.findByIdAndDelete(id);

    if (!deletedRecord) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    return NextResponse.json(
      { message: 'Record deleted successfully' }
    );
  } catch (err: unknown) {
    console.error('Error deleting record:', err);
    const errorMessage = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
