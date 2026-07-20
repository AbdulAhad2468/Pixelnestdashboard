import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const MESSAGES_FILE = path.join(DATA_DIR, "private-messages.json");

// PUT mark message as read
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    if (!fs.existsSync(MESSAGES_FILE)) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    const messages = JSON.parse(fs.readFileSync(MESSAGES_FILE, "utf-8"));
    const message = messages.find((msg: any) => msg.id === id);

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    message.read = true;
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to mark message as read" }, { status: 500 });
  }
}
