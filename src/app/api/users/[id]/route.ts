import { NextRequest, NextResponse } from "next/server";
import { getUserById, updateUser } from "@/lib/db";
import { sql } from '@vercel/postgres';

// PUT - Edit user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { name, email, role, approved } = await request.json();

    if (!name || !email || !role) {
      return NextResponse.json({ error: "Name, email, and role are required" }, { status: 400 });
    }

    const existingUser = await getUserById(params.id);
    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isProtectedAdmin = existingUser.name && existingUser.name.toLowerCase().includes("pixel nest");

    // Protected admin users always keep admin role
    const updates: any = {
      name,
      email,
    };

    if (isProtectedAdmin) {
      updates.role = "admin";
      updates.approved = true;
    } else {
      updates.role = role;
      updates.approved = approved;
    }

    const updatedUser = await updateUser(params.id, updates);
    const { password, ...userWithoutPassword } = updatedUser;
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error("Failed to edit user:", error);
    return NextResponse.json({ error: "Failed to edit user" }, { status: 500 });
  }
}

// DELETE - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existingUser = await getUserById(params.id);
    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isProtectedAdmin = existingUser.name && existingUser.name.toLowerCase().includes("pixel nest");

    if (isProtectedAdmin) {
      return NextResponse.json({ error: "Cannot delete protected admin user" }, { status: 403 });
    }

    await sql`DELETE FROM users WHERE id = ${params.id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete user:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
