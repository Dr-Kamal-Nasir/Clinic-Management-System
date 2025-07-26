// app/api/admin/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { User } from '@/lib/models/User';
import dbConnect from '@/lib/dbConnect';
import { UserSchema } from '@/lib/schemas/userSchema';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';

interface TokenPayload {
  role: string;
  [key: string]: any;
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
  await dbConnect();
  
  try {
    // Verify admin role
    const cookieStore = cookies();
    const accessToken = (await cookieStore).get('accessToken')?.value;
    
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const decoded: TokenPayload = jwtDecode(accessToken);
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const body = await req.json();
    const validation = UserSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(validation.error, { status: 400 });
    }
    
    // Don't update password if not provided
    const updateData: Partial<typeof body> = { ...body };
    if (!body.password) {
      delete updateData.password;
    } else {
      updateData.password = await bcrypt.hash(body.password, 10);
    }
    
    const user = await User.findByIdAndUpdate(
      params.id, 
      updateData, 
      { new: true, select: '-password' }
    );
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json(user);
  } catch (error) {
    console.error('Failed to update user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
  await dbConnect();
  
  try {
    // Verify admin role
    const cookieStore = cookies();
    const accessToken = (await cookieStore).get('accessToken')?.value;
    
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const decoded: TokenPayload = jwtDecode(accessToken);
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const user = await User.findByIdAndDelete(params.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
