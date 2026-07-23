import { NextRequest, NextResponse } from "next/server";
import { getPrivateMessages, createPrivateMessage, deletePrivateMessage } from "@/lib/db";

// GET all messages for a user
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const messages = await getPrivateMessages(userId);
    const formattedMessages = messages.map((msg: any) => ({
      id: msg.id,
      senderId: msg.senderId,
      receiverId: msg.receiverId,
      text: msg.text,
      timestamp: msg.timestamp,
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
    const { senderId, receiverId, text, attachment } = await request.json();

    if (!senderId || !receiverId || !text) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newMessage = {
      id: Date.now().toString(),
      senderId,
      receiverId,
      text,
      attachment: attachment || null,
      timestamp: new Date().toISOString(),
      read: false,
    };

    const createdMessage = await createPrivateMessage(newMessage);
    return NextResponse.json({
      id: createdMessage.id,
      senderId: createdMessage.senderId,
      receiverId: createdMessage.receiverId,
      text: createdMessage.text,
      timestamp: createdMessage.timestamp,
      read: createdMessage.read,
      attachment: createdMessage.attachment
    });
  } catch (error) {
    console.error("Failed to send message:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}

// DELETE private message
export async function DELETE(request: NextRequest) {
  try {
    const { messageId } = await request.json();

    if (!messageId) {
      return NextResponse.json({ error: "Message ID required" }, { status: 400 });
    }

    await deletePrivateMessage(messageId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete message:", error);
    return NextResponse.json({ error: "Failed to delete message" }, { status: 500 });
  }
}
