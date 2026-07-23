import { NextRequest, NextResponse } from "next/server";
import { createMessage, deleteChannelMessage } from "@/lib/db";

// POST add message to channel
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { text, sender, attachment } = await request.json();

    if (!text || !sender) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newMessage = {
      id: Date.now().toString(),
      channelId: id,
      text,
      sender,
      attachment: attachment || null,
      timestamp: new Date().toISOString(),
    };

    const createdMessage = await createMessage(newMessage);
    return NextResponse.json({
      id: createdMessage.id,
      text: createdMessage.text,
      sender: createdMessage.sender,
      timestamp: createdMessage.timestamp,
      attachment: createdMessage.attachment
    });
  } catch (error) {
    console.error("Failed to add message:", error);
    return NextResponse.json({ error: "Failed to add message" }, { status: 500 });
  }
}

// DELETE message from channel
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { messageId } = await request.json();

    if (!messageId) {
      return NextResponse.json({ error: "Message ID required" }, { status: 400 });
    }

    await deleteChannelMessage(messageId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete message:", error);
    return NextResponse.json({ error: "Failed to delete message" }, { status: 500 });
  }
}
