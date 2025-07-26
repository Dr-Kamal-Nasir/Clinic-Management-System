import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/dbConnect';
import {User} from '@/lib/models/User';

export async function POST(request: NextRequest) {
  await dbConnect();

  try {
    const { name, email, password, phone } = await request.json();
    console.log('Registration attempt for:', email);

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user (not approved by default)
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      approved: false
    });

    await newUser.save();
    console.log('User registered:', email);

    return NextResponse.json({ 
      message: 'Registration successful! Account pending admin approval.' 
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
