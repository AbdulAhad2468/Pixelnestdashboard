import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

const ADMIN_USER = {
  id: "admin",
  email: "admin123@owner.com",
  name: "Admin",
  role: "admin",
  createdAt: new Date().toISOString(),
};

// GET all users (for private chat user list)
export async function GET() {
  try {
    let users = [];

    if (fs.existsSync(USERS_FILE)) {
      users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
    }

    // Add admin user to the list
    users.push(ADMIN_USER);

    // Remove passwords from response
    const usersWithoutPasswords = users.map((user: any) => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    return NextResponse.json(usersWithoutPasswords);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
