import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    // Mock registration process
    const { name, email, password } = await req.json();
    
    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Please provide all required fields" },
        { status: 400 }
      );
    }
    
    // Mock success response
    return NextResponse.json(
      { 
        message: "User registered successfully",
        user: { 
          name, 
          email,
          id: 'mock-user-id-' + Math.random().toString(36).substr(2, 9)
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Registration failed" },
      { status: 500 }
    );
  }
}