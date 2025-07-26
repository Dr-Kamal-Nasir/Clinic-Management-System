//app/api/auth/me/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { User } from '@/lib/models/User'; // Named import
import dbConnect from '@/lib/dbConnect';
import jwt from 'jsonwebtoken';

export async function GET(req: NextRequest) {
  await dbConnect();
  
  // Check JWT_SECRET
  if (!process.env.JWT_SECRET) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const token = req.headers.get('Authorization')?.split(' ')[1];
  
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { id: string };
    
    // Find user
    const user = await User.findById(decoded.id).select('-password -refreshTokens');
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar
    });
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
