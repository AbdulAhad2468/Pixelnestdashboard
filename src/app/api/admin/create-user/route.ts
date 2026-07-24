import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create a Supabase client with service role key for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, role = "member" } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, password, and name are required" },
        { status: 400 }
      );
    }

    if (role !== "super_admin" && role !== "member") {
      return NextResponse.json(
        { error: "Invalid role. Must be 'super_admin' or 'member'" },
        { status: 400 }
      );
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role,
      },
    });

    if (authError) {
      console.error("Auth error:", authError);
      return NextResponse.json(
        { error: authError.message || "Failed to create user" },
        { status: 400 }
      );
    }

    // Manually create profile to ensure it's created correctly
    console.log("Creating profile for user:", authData.user.id);
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: authData.user.email,
        name: name,
        role: role,
      });

    if (profileError) {
      console.error("Profile creation error:", profileError);
      // If profile creation fails, it might already exist due to trigger
      // Try to update it instead
      console.log("Profile creation failed, trying to update...");
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          name: name,
          role: role,
        })
        .eq('id', authData.user.id);

      if (updateError) {
        console.error("Profile update error:", updateError);
        // Continue anyway as the trigger might have handled it
      } else {
        console.log("Profile updated successfully");
      }
    } else {
      console.log("Profile created successfully");
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name,
        role,
      },
    });
  } catch (error: any) {
    console.error("Create user error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create user" },
      { status: 500 }
    );
  }
}
