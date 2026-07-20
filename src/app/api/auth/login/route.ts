import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const ADMIN_CREDENTIALS = {
  email: "admin123@owner.com",
  password: "Jontigrid2024*",
};

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Check admin credentials
    if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
      return NextResponse.json({
        user: {
          id: "admin",
          email: ADMIN_CREDENTIALS.email,
          name: "Admin",
          role: "admin",
        },
      });
    }

    // Check regular users
    if (!fs.existsSync(USERS_FILE)) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
    const user = users.find((u: any) => u.email === email && u.password === password);

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({ user: userWithoutPassword });
  } catch (error) {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
