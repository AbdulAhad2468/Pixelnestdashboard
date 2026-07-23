import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Check regular users
    if (!fs.existsSync(USERS_FILE)) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
    const user = users.find((u: any) => u.email === email && u.password === password);

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Pixel Nest user always gets admin authority
    if (user.name && user.name.toLowerCase().includes("pixel nest")) {
      user.role = "admin";
      fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    }
    
    // Abdul Ahad (Web developer) gets admin authority for board access
    if (user.name && user.name.toLowerCase().includes("abdul ahad")) {
      user.role = "admin";
      fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    }

    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({ user: userWithoutPassword });
  } catch (error) {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
