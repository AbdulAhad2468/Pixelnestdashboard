import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create a Supabase client with service role key for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

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

    if (role !== "super_admin" && role !== "member") {
      return NextResponse.json({ error: "Invalid role. Must be 'super_admin' or 'member'" }, { status: 400 });
    }

    // Update profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .update({ name, email, role })
      .eq("id", params.id)
      .select()
      .single();

    if (profileError) {
      console.error("Profile update error:", profileError);
      return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
    }

    return NextResponse.json(profile);
  } catch (error: any) {
    console.error("Failed to edit user:", error);
    return NextResponse.json({ error: error.message || "Failed to edit user" }, { status: 500 });
  }
}

// DELETE - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // First, get the user to check if they're a protected super admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", params.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent deletion of super admins (you can add additional protection logic here)
    if (profile.role === "super_admin") {
      return NextResponse.json({ error: "Cannot delete super admin user" }, { status: 403 });
    }

    // Delete user from Supabase Auth (requires service role)
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(params.id);

    if (authError) {
      console.error("Auth delete error:", authError);
      // Continue with profile deletion even if auth fails
    }

    // Explicitly delete the profile from the database
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", params.id);

    if (profileError) {
      console.error("Profile delete error:", profileError);
      return NextResponse.json({ error: "Failed to delete user profile" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete user:", error);
    return NextResponse.json({ error: error.message || "Failed to delete user" }, { status: 500 });
  }
}
