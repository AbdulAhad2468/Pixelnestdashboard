import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Validation helpers
function validateUUID(id: any): string | null {
  if (typeof id !== 'string') return 'ID must be a string';
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) return 'Invalid UUID format';
  return null;
}

function validateMessageText(text: any): string | null {
  if (typeof text !== 'string') return 'Message text must be a string';
  if (text.trim().length === 0) return 'Message text cannot be empty';
  if (text.length > 10000) return 'Message text must be less than 10,000 characters';
  return null;
}

// GET all messages for a user
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    // Skip strict UUID validation to support legacy IDs during migration
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: "Valid user ID is required" }, { status: 400 });
    }

    const { data: messages, error } = await supabase
      .from("private_messages")
      .select("*")
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message || "Failed to fetch messages" }, { status: 500 });
    }

    const formattedMessages = messages.map((msg: any) => ({
      id: msg.id,
      senderId: msg.sender_id,
      receiverId: msg.receiver_id,
      text: msg.text,
      timestamp: msg.created_at,
      read: msg.read,
      attachment: msg.attachment
    }));

    return NextResponse.json(formattedMessages);
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

// POST send private message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { senderId, receiverId, text, attachment } = body;

    // Skip strict UUID validation to support legacy IDs during migration
    // Only validate that IDs are present and are strings
    if (!senderId || typeof senderId !== 'string') {
      return NextResponse.json({ error: "Valid sender ID is required" }, { status: 400 });
    }

    if (!receiverId || typeof receiverId !== 'string') {
      return NextResponse.json({ error: "Valid receiver ID is required" }, { status: 400 });
    }

    const textError = validateMessageText(text);
    if (textError) {
      return NextResponse.json({ error: textError }, { status: 400 });
    }

    if (attachment !== null && attachment !== undefined) {
      if (typeof attachment !== 'string') {
        return NextResponse.json({ error: 'Attachment must be a string' }, { status: 400 });
      }
      if (attachment.length > 5000000) { // 5MB limit
        return NextResponse.json({ error: 'Attachment size exceeds 5MB limit' }, { status: 400 });
      }
    }

    // Verify both sender and receiver exist in profiles table
    const { data: senderProfile, error: senderError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", senderId)
      .single();

    if (senderError || !senderProfile) {
      return NextResponse.json({ error: "Sender profile not found" }, { status: 400 });
    }

    const { data: receiverProfile, error: receiverError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", receiverId)
      .single();

    if (receiverError || !receiverProfile) {
      return NextResponse.json({ error: "Receiver profile not found" }, { status: 400 });
    }

    const { data: message, error } = await supabase
      .from("private_messages")
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        text: text.trim(),
        attachment: attachment || null,
        read: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message || "Failed to send message" }, { status: 500 });
    }

    return NextResponse.json({
      id: message.id,
      senderId: message.sender_id,
      receiverId: message.receiver_id,
      text: message.text,
      timestamp: message.created_at,
      read: message.read,
      attachment: message.attachment
    });
  } catch (error) {
    console.error("Failed to send message:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}

// DELETE private message
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { messageId } = body;

    const messageIdError = validateUUID(messageId);
    if (messageIdError) {
      return NextResponse.json({ error: messageIdError }, { status: 400 });
    }

    const { error } = await supabase
      .from("private_messages")
      .delete()
      .eq("id", messageId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete message:", error);
    return NextResponse.json({ error: "Failed to delete message" }, { status: 500 });
  }
}
