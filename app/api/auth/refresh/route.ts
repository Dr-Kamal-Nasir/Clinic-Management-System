import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/dbConnect';
import { User } from '@/lib/models/User'; // Named import

export async function POST(request: NextRequest) {
  const token = request.headers.get('Authorization')?.split(' ')[1];
  
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check JWT_SECRET
  if (!process.env.JWT_SECRET) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { id: string };
    await dbConnect();
    
    // Find user and check if refresh token is valid
    const user = await User.findOne({ 
      _id: decoded.id,
      refreshTokens: token
    });
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // Create new access token
    const accessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    return NextResponse.json({ accessToken });
  } catch (error) {
    console.error('Token refresh error:', error);
    
    // If token is invalid, remove it from the user's refresh tokens
    try {
      const decoded = jwt.decode(token) as { id: string };
      if (decoded?.id) {
        await dbConnect();
        await User.updateOne(
          { _id: decoded.id },
          { $pull: { refreshTokens: token } }
        );
      }
    } catch (cleanupError) {
      console.error('Token cleanup failed:', cleanupError);
    }
    
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
