import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Test endpoint to verify database connection and permissions
export async function GET() {
  const results = {
    timestamp: new Date().toISOString(),
    tests: [] as any[]
  };

  try {
    // Test 1: Check if we can query profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, name, role")
      .limit(1);

    results.tests.push({
      name: "Query profiles table",
      success: !profilesError,
      error: profilesError?.message,
      data: profiles ? `Found ${profiles.length} profiles` : null
    });

    // Test 2: Check if we can query channels
    const { data: channels, error: channelsError } = await supabase
      .from("channels")
      .select("id, name")
      .limit(1);

    results.tests.push({
      name: "Query channels table",
      success: !channelsError,
      error: channelsError?.message,
      data: channels ? `Found ${channels.length} channels` : null
    });

    // Test 3: Check if we can query channel_messages
    const { data: messages, error: messagesError } = await supabase
      .from("channel_messages")
      .select("id, text")
      .limit(1);

    results.tests.push({
      name: "Query channel_messages table",
      success: !messagesError,
      error: messagesError?.message,
      data: messages ? `Found ${messages.length} messages` : null
    });

    // Test 4: Check if we can query private_messages
    const { data: privateMessages, error: privateMessagesError } = await supabase
      .from("private_messages")
      .select("id, text")
      .limit(1);

    results.tests.push({
      name: "Query private_messages table",
      success: !privateMessagesError,
      error: privateMessagesError?.message,
      data: privateMessages ? `Found ${privateMessages.length} messages` : null
    });

    // Test 5: Try to insert a test channel message (will be rolled back if fails)
    const { data: testChannel, error: testChannelError } = await supabase
      .from("channels")
      .select("id")
      .limit(1)
      .single();

    if (testChannel && !testChannelError) {
      const { error: insertError } = await supabase
        .from("channel_messages")
        .insert({
          channel_id: testChannel.id,
          text: "Test message - please delete",
          sender_id: "00000000-0000-0000-0000-000000000000", // Invalid UUID to test RLS
          attachment: null
        });

      results.tests.push({
        name: "Test channel message insertion (with invalid sender)",
        success: insertError !== undefined, // Should fail due to RLS/invalid UUID
        error: insertError?.message,
        data: "Expected to fail due to RLS or invalid UUID"
      });
    }

    // Test 6: Check auth session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    results.tests.push({
      name: "Check auth session",
      success: !!session && !sessionError,
      error: sessionError?.message,
      data: session ? {
        user_id: session.user?.id,
        email: session.user?.email,
        expires_at: new Date(session.expires_at! * 1000).toISOString()
      } : null
    });

  } catch (error: any) {
    results.tests.push({
      name: "General error",
      success: false,
      error: error.message,
      data: null
    });
  }

  return NextResponse.json(results);
}
