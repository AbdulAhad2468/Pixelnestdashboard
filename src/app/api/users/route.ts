import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Use service role client to bypass RLS for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// GET all users (for private chat user list)
export async function GET() {
  try {
    console.log("Fetching all profiles from database using service role...");
    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Database error fetching profiles:", error);
      throw error;
    }

    console.log("Fetched profiles count:", profiles?.length);
    console.log("Fetched profiles:", profiles);

    return NextResponse.json(profiles);
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
