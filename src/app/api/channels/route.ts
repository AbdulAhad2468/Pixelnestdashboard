import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { initializeAllData } from "@/lib/init-data";

const DATA_DIR = path.join(process.cwd(), "data");
const CHANNELS_FILE = path.join(DATA_DIR, "channels.json");

// GET all channels
export async function GET() {
  try {
    initializeAllData();
    if (!fs.existsSync(CHANNELS_FILE)) {
      return NextResponse.json([]);
    }
    const channels = JSON.parse(fs.readFileSync(CHANNELS_FILE, "utf-8"));
    return NextResponse.json(channels);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch channels" }, { status: 500 });
  }
}

// POST create new channel
export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "Channel name is required" }, { status: 400 });
    }

    // Ensure data directory exists
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    // Read existing channels
    let channels = [];
    if (fs.existsSync(CHANNELS_FILE)) {
      channels = JSON.parse(fs.readFileSync(CHANNELS_FILE, "utf-8"));
    }

    // Check if channel already exists
    if (channels.find((c: any) => c.name === name)) {
      return NextResponse.json({ error: "Channel already exists" }, { status: 400 });
    }

    const newChannel = {
      id: Date.now().toString(),
      name,
      messages: [],
      createdAt: new Date().toISOString(),
    };

    channels.push(newChannel);
    fs.writeFileSync(CHANNELS_FILE, JSON.stringify(channels, null, 2));

    return NextResponse.json(newChannel);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create channel" }, { status: 500 });
  }
}
