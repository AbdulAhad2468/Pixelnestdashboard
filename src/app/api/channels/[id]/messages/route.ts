import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const CHANNELS_FILE = path.join(DATA_DIR, "channels.json");

// POST add message to channel
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { text, sender, attachment } = await request.json();

    if (!text || !sender) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!fs.existsSync(CHANNELS_FILE)) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    const channels = JSON.parse(fs.readFileSync(CHANNELS_FILE, "utf-8"));
    const channel = channels.find((c: any) => c.id === id);

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    const newMessage = {
      id: Date.now().toString(),
      text,
      sender,
      timestamp: new Date().toISOString(),
      attachment: attachment || undefined,
    };

    channel.messages.push(newMessage);
    fs.writeFileSync(CHANNELS_FILE, JSON.stringify(channels, null, 2));

    return NextResponse.json(newMessage);
  } catch (error) {
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

    if (!fs.existsSync(CHANNELS_FILE)) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    const channels = JSON.parse(fs.readFileSync(CHANNELS_FILE, "utf-8"));
    const channel = channels.find((c: any) => c.id === id);

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    const messageIndex = channel.messages.findIndex((m: any) => m.id === messageId);
    if (messageIndex === -1) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    channel.messages.splice(messageIndex, 1);
    fs.writeFileSync(CHANNELS_FILE, JSON.stringify(channels, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete message" }, { status: 500 });
  }
}
