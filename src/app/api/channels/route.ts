import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Validation helpers
function validateChannelName(name: any): string | null {
  if (typeof name !== 'string') return 'Channel name must be a string';
  if (name.trim().length === 0) return 'Channel name cannot be empty';
  if (name.length > 100) return 'Channel name must be less than 100 characters';
  if (!/^[a-zA-Z0-9\s-_]+$/.test(name)) return 'Channel name can only contain letters, numbers, spaces, hyphens, and underscores';
  return null;
}

function validateUUID(id: any): string | null {
  if (typeof id !== 'string') return 'ID must be a string';
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) return 'Invalid UUID format';
  return null;
}

// GET all channels
export async function GET() {
  try {
    const { data: channels, error: channelsError } = await supabase
      .from("channels")
      .select("*")
      .order("created_at", { ascending: true });

    if (channelsError) {
      console.error("Supabase channels error:", channelsError);
      return NextResponse.json({ error: channelsError.message || "Failed to fetch channels" }, { status: 500 });
    }

    // If no channels exist, return empty array
    if (!channels || channels.length === 0) {
      console.log("No channels found in database");
      return NextResponse.json([]);
    }

    // Fetch messages for each channel
    const channelsWithMessages = await Promise.all(
      channels.map(async (channel: any) => {
        const { data: messages, error: messagesError } = await supabase
          .from("channel_messages")
          .select("*")
          .eq("channel_id", channel.id)
          .order("created_at", { ascending: true });

        if (messagesError) {
          console.error("Supabase messages error for channel", channel.id, ":", messagesError);
          // Return channel without messages if fetch fails
          return {
            id: channel.id,
            name: channel.name,
            createdAt: channel.created_at,
            messages: []
          };
        }

        return {
          id: channel.id,
          name: channel.name,
          createdAt: channel.created_at,
          messages: messages.map((msg: any) => ({
            id: msg.id,
            text: msg.text,
            senderId: msg.sender_id,
            timestamp: msg.created_at,
            attachment: msg.attachment
          }))
        };
      })
    );

    return NextResponse.json(channelsWithMessages);
  } catch (error: any) {
    console.error("Failed to fetch channels:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch channels" }, { status: 500 });
  }
}

// POST create new channel
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    const nameError = validateChannelName(name);
    if (nameError) {
      return NextResponse.json({ error: nameError }, { status: 400 });
    }

    const { data: channel, error } = await supabase
      .from("channels")
      .insert({ name: name.trim() })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      id: channel.id,
      name: channel.name,
      createdAt: channel.created_at,
      messages: []
    });
  } catch (error) {
    console.error("Failed to create channel:", error);
    return NextResponse.json({ error: "Failed to create channel" }, { status: 500 });
  }
}

// PUT update channel
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name } = body;

    const idError = validateUUID(id);
    if (idError) {
      return NextResponse.json({ error: idError }, { status: 400 });
    }

    const nameError = validateChannelName(name);
    if (nameError) {
      return NextResponse.json({ error: nameError }, { status: 400 });
    }

    const { data: channel, error } = await supabase
      .from("channels")
      .update({ name: name.trim() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      id: channel.id,
      name: channel.name,
      createdAt: channel.created_at
    });
  } catch (error) {
    console.error("Failed to update channel:", error);
    return NextResponse.json({ error: "Failed to update channel" }, { status: 500 });
  }
}

// DELETE channel
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    const idError = validateUUID(id);
    if (idError) {
      return NextResponse.json({ error: idError }, { status: 400 });
    }

    const { error } = await supabase
      .from("channels")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete channel:", error);
    return NextResponse.json({ error: "Failed to delete channel" }, { status: 500 });
  }
}
