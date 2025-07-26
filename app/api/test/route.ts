import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';

export async function GET() {
  try {
    await dbConnect();
    const count = await User.countDocuments();
    return NextResponse.json({ userCount: count });
  } catch (error) {
    console.error('DB test error:', error);
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
  }
}