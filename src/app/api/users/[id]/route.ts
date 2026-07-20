import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

// PUT - Edit user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { name, email, role } = await request.json();

    if (!name || !email || !role) {
      return NextResponse.json({ error: "Name, email, and role are required" }, { status: 400 });
    }

    if (params.id === "admin") {
      return NextResponse.json({ error: "Cannot edit admin user" }, { status: 403 });
    }

    if (!fs.existsSync(USERS_FILE)) {
      return NextResponse.json({ error: "Users file not found" }, { status: 404 });
    }

    const users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
    const userIndex = users.findIndex((u: any) => u.id === params.id);

    if (userIndex === -1) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    users[userIndex].name = name;
    users[userIndex].email = email;
    users[userIndex].role = role;
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

    const { password, ...userWithoutPassword } = users[userIndex];
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    return NextResponse.json({ error: "Failed to edit user" }, { status: 500 });
  }
}

// DELETE - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (params.id === "admin") {
      return NextResponse.json({ error: "Cannot delete admin user" }, { status: 403 });
    }

    if (!fs.existsSync(USERS_FILE)) {
      return NextResponse.json({ error: "Users file not found" }, { status: 404 });
    }

    const users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
    const userIndex = users.findIndex((u: any) => u.id === params.id);

    if (userIndex === -1) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    users.splice(userIndex, 1);
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
