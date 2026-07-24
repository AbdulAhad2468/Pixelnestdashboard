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

// POST add message to channel
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { text, senderId, attachment } = body;

    // Skip UUID validation for channel ID to support legacy string IDs
    // Only validate sender ID as it must be a valid UUID from Supabase Auth
    const senderIdError = validateUUID(senderId);
    if (senderIdError) {
      return NextResponse.json({ error: senderIdError }, { status: 400 });
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

    // Verify sender exists in profiles table
    const { data: senderProfile, error: senderError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", senderId)
      .single();

    if (senderError || !senderProfile) {
      return NextResponse.json({ error: "Sender profile not found" }, { status: 400 });
    }

    const { data: message, error } = await supabase
      .from("channel_messages")
      .insert({
        channel_id: params.id,
        text: text.trim(),
        sender_id: senderId,
        attachment: attachment || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message || "Failed to add message" }, { status: 500 });
    }

    return NextResponse.json({
      id: message.id,
      text: message.text,
      senderId: message.sender_id,
      timestamp: message.created_at,
      attachment: message.attachment
    });
  } catch (error) {
    console.error("Failed to add message:", error);
    return NextResponse.json({ error: "Failed to add message" }, { status: 500 });
  }
}

// DELETE message from channel
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { messageId } = body;

    const messageIdError = validateUUID(messageId);
    if (messageIdError) {
      return NextResponse.json({ error: messageIdError }, { status: 400 });
    }

    const { error } = await supabase
      .from("channel_messages")
      .delete()
      .eq("id", messageId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete message:", error);
    return NextResponse.json({ error: "Failed to delete message" }, { status: 500 });
  }
}
