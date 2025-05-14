// src/app/api/auth/register/route.ts
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/db'; // Your DB connection helper
import User from '@/models/User'; // Your Mongoose User model

// --- Constants ---
const SALT_ROUNDS = 10; // Cost factor for bcrypt hashing (10-12 is generally recommended)

export async function POST(request: Request) {
    try {
        // --- 1. Parse Request Body ---
        let body;
        try {
            body = await request.json();
        } catch (error) {
            return new NextResponse(JSON.stringify({ error: 'Invalid JSON body.' }), { status: 400 });
        }

        const { username, email, password } = body;

        // --- 2. Basic Validation ---
        if (!username || typeof username !== 'string' || username.trim().length < 3) {
            return new NextResponse(JSON.stringify({ error: 'Username is required (min 3 characters).' }), { status: 400 });
        }
        if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) {
             return new NextResponse(JSON.stringify({ error: 'Valid email is required.' }), { status: 400 });
        }
        if (!password || typeof password !== 'string' || password.length < 8) {
            // Add more password strength checks if desired (e.g., regex for complexity)
            return new NextResponse(JSON.stringify({ error: 'Password is required (min 8 characters).' }), { status: 400 });
        }

        // --- 3. Connect to Database ---
        await connectToDatabase();

        // --- 4. Check for Existing User ---
        // Check both username and email for uniqueness
        const existingUserByEmail = await User.findOne({ email: email.toLowerCase() });
        if (existingUserByEmail) {
            return new NextResponse(JSON.stringify({ error: 'Email already exists.' }), { status: 409 }); // 409 Conflict
        }
        const existingUserByUsername = await User.findOne({ username: username });
        if (existingUserByUsername) {
            return new NextResponse(JSON.stringify({ error: 'Username already exists.' }), { status: 409 }); // 409 Conflict
        }

        // --- 5. Hash Password ---
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // --- 6. Create and Save New User ---
        const newUser = new User({
            username: username.trim(), // Trim whitespace
            email: email.toLowerCase().trim(), // Store lowercase email
            passwordHash: hashedPassword,
            // Initialize other fields from your User schema as needed
            // alpacaPaperTrading: true, // Default is set in schema
            // twoFactorEnabled: false, // Default is set in schema
        });

        await newUser.save();

        console.log(`User registered successfully: ${newUser.email}`);

        // --- 7. Return Success Response ---
        // Avoid sending back sensitive info like the hash
        return NextResponse.json({ message: 'User registered successfully!' }, { status: 201 }); // 201 Created

    } catch (error: any) {
        console.error("Registration Error:", error);
        // Handle potential Mongoose validation errors or other DB errors
        if (error.name === 'ValidationError') {
             return new NextResponse(JSON.stringify({ error: 'Validation failed.', details: error.errors }), { status: 400 });
        }
        return new NextResponse(JSON.stringify({ error: 'Internal server error during registration.' }), { status: 500 });
    }
}
