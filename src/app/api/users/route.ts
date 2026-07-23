import { NextRequest, NextResponse } from "next/server";
import { getUsers } from "@/lib/db";

// GET all users (for private chat user list)
export async function GET() {
  try {
    const users = await getUsers();

    // Remove passwords from response and format
    const usersWithoutPasswords = users.map((user: any) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      approved: user.approved,
      createdAt: user.created_at
    }));

    return NextResponse.json(usersWithoutPasswords);
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
