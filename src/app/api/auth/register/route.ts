import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { mongoConnect } from '@/lib/mongoConnect';
import User from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    await mongoConnect();

    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 409 }
      );
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ email, password: hashed });

    return NextResponse.json(
      { message: 'User registered', userId: user._id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ⛔ THIS IS IMPORTANT! Prevents static optimization issues
export const dynamic = 'force-dynamic';
