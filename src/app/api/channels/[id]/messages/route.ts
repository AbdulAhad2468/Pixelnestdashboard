import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const CHANNELS_FILE = path.join(DATA_DIR, "channels.json");

// POST add message to channel
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { text, sender } = await request.json();

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
    };

    channel.messages.push(newMessage);
    fs.writeFileSync(CHANNELS_FILE, JSON.stringify(channels, null, 2));

    return NextResponse.json(newMessage);
  } catch (error) {
    return NextResponse.json({ error: "Failed to add message" }, { status: 500 });
  }
}
