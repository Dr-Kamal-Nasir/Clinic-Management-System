// app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { User } from '@/lib/models/User';
import dbConnect from '@/lib/dbConnect';
import { UserSchema } from '@/lib/schemas/userSchema';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';

export async function GET(req: NextRequest) {
  await dbConnect();
  
  try {
    // Verify admin role
    const cookieStore = cookies();
    const accessToken = (await cookieStore).get('accessToken')?.value;
    
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const decoded: any = jwtDecode(accessToken);
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const users = await User.find({}, '-password -refreshTokens');
    return NextResponse.json(users);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  await dbConnect();
  
  try {
    // Verify admin role
    const cookieStore = cookies();
    const accessToken = (await cookieStore).get('accessToken')?.value;
    
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const decoded: any = jwtDecode(accessToken);
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const body = await req.json();
    const validation = UserSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(validation.error, { status: 400 });
    }
    
    // Check if email exists
    const existingUser = await User.findOne({ email: body.email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already exists' }, 
        { status: 400 }
      );
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(body.password, 10);
    
    const newUser = await User.create({
      ...body,
      password: hashedPassword
    });
    
    // Exclude password and refresh tokens
    const { password, refreshTokens, ...userWithoutSensitive } = newUser.toObject();
    return NextResponse.json(userWithoutSensitive, { status: 201 });
  } catch (error) {
    console.error('Failed to create user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' }, 
      { status: 500 }
    );
  }
}
