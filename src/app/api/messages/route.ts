import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const MESSAGES_FILE = path.join(DATA_DIR, "private-messages.json");

// GET all messages for a user
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    if (!fs.existsSync(MESSAGES_FILE)) {
      return NextResponse.json([]);
    }

    const messages = JSON.parse(fs.readFileSync(MESSAGES_FILE, "utf-8"));
    const userMessages = messages.filter((msg: any) => 
      msg.senderId === userId || msg.receiverId === userId
    );

    return NextResponse.json(userMessages);
  } catch (error) {
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

    // Ensure data directory exists
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    // Read existing messages
    let messages = [];
    if (fs.existsSync(MESSAGES_FILE)) {
      messages = JSON.parse(fs.readFileSync(MESSAGES_FILE, "utf-8"));
    }

    const newMessage = {
      id: Date.now().toString(),
      senderId,
      receiverId,
      text,
      timestamp: new Date().toISOString(),
      read: false,
      attachment: attachment || undefined,
    };

    messages.push(newMessage);
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));

    return NextResponse.json(newMessage);
  } catch (error) {
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

    if (!fs.existsSync(MESSAGES_FILE)) {
      return NextResponse.json({ error: "Messages file not found" }, { status: 404 });
    }

    const messages = JSON.parse(fs.readFileSync(MESSAGES_FILE, "utf-8"));
    const messageIndex = messages.findIndex((m: any) => m.id === messageId);
    
    if (messageIndex === -1) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    messages.splice(messageIndex, 1);
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete message" }, { status: 500 });
  }
}
