import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, createUser } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }

    // Create new user (auto-approved for immediate access)
    const newUser = {
      id: Date.now().toString(),
      email,
      password,
      name,
      role: "member",
      approved: true,
      createdAt: new Date().toISOString(),
    };

    const createdUser = await createUser(newUser);
    const { password: _, ...userWithoutPassword } = createdUser;
    return NextResponse.json({ user: userWithoutPassword });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Signup failed" }, { status: 500 });
  }
}
