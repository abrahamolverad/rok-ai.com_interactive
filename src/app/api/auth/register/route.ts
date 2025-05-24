// src/app/api/auth/register/route.ts
import { NextResponse } from 'next/server';
import { mongoConnect } from '@/lib/mongoConnect'; // Using your mongoConnect utility
import { User, IUser } from '@/models/User';      // Your Mongoose User model and interface
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    await mongoConnect(); // Ensure database is connected

    const { name, email, password } = await request.json();

    // Basic validation
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields: name, email, and password are required.' }, { status: 400 });
    }
    if (typeof email !== 'string' || typeof password !== 'string' || typeof name !== 'string') {
        return NextResponse.json({ error: 'Invalid field types.' }, { status: 400 });
    }
    // You can add more specific email validation if needed
    if (password.length < 6) { 
        return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() }).lean(); // .lean() for faster queries if you don't need mongoose docs
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists.' }, { status: 409 }); // 409 Conflict
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10); // 10-12 salt rounds are common

    // Create and save the new user
    const newUser = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      // createdAt and updatedAt will be handled by Mongoose timestamps if schema is configured
    });
    await newUser.save();

    // Note: Do not return the user object with the password hash
    return NextResponse.json({ message: 'User registered successfully.' }, { status: 201 });

  } catch (error) {
    console.error('Registration API Error:', error);
    let errorMessage = 'An unexpected error occurred during registration.';
    // You might want to check error type for more specific messages in production
    // For example, if (error instanceof mongoose.Error.ValidationError) { ... }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}