// app/api/admin/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { User } from '@/lib/models/User';
import dbConnect from '@/lib/dbConnect';
import { UpdateUserSchema } from '@/lib/schemas/userSchema';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';

interface TokenPayload {
  role: string;
  key: string;
}

// Updated type definitions
type RouteParams = { id: string };
type RouteContext = { params: RouteParams };

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
): Promise<NextResponse> {
  await dbConnect();
  const { id } = await params;

  try {
    // Verify authentication
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify token is valid
    try {
      jwtDecode(accessToken);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const user = await User.findById(id).select('-password -refreshTokens');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
): Promise<NextResponse> {
  await dbConnect();
  const { id } = await params;

  try {
    // Get cookies synchronously
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;
    
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify token with error handling
    let decoded: TokenPayload;
    try {
      decoded = jwtDecode(accessToken);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Parse and validate request body
    const body = await request.json();
    const validation = UpdateUserSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validation.error.flatten() 
        },
        { status: 400 }
      );
    }
    
    // Prepare update data
    const updateData: Partial<typeof body> = { ...validation.data };
    
    // Handle password hashing if present
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    } else {
      delete updateData.password;
    }
    
    // Update user in database
    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { 
        new: true, 
        select: '-password -refreshTokens' 
      }
    );
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json(user);
  } catch (error) {
    console.error('Failed to update user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
): Promise<NextResponse> {
  await dbConnect();
  const { id } = await params;
  
  try {
    // Verify admin role
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;
    
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    let decoded: TokenPayload;
    try {
      decoded = jwtDecode(accessToken);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json(
      { success: true, message: 'User deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to delete user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
