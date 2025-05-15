import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { mongoConnect } from "@/lib/mongoConnect";
import User from "@/models/User";

/**
 * POST /api/auth/register
 * Body: { email: string, password: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { email, password } = (await req.json()) as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Basic strength check – adjust as needed
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    await mongoConnect();

    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 }
      );
    }

    const hash = await bcrypt.hash(password, 12); // 12 salt rounds
    const user = await User.create({ email, password: hash });

    return NextResponse.json(
      { message: "User registered", userId: user._id },
      { status: 201 }
    );
  } catch (err) {
    console.error("Register error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// (optional) Limit the endpoint to POST only
export const dynamic = "force-dynamic"