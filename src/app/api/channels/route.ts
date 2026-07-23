import { NextRequest, NextResponse } from "next/server";
import { getChannels, createChannel } from "@/lib/db";

// GET all channels
export async function GET() {
  try {
    const channels = await getChannels();
    
    // Fetch messages for each channel
    const channelsWithMessages = await Promise.all(
      channels.map(async (channel: any) => {
        const { getMessages } = await import("@/lib/db");
        const messages = await getMessages(channel.id);
        return {
          ...channel,
          messages: messages.map((msg: any) => ({
            id: msg.id,
            text: msg.text,
            sender: msg.sender,
            timestamp: msg.created_at,
            attachment: msg.attachment
          }))
        };
      })
    );
    
    return NextResponse.json(channelsWithMessages);
  } catch (error) {
    console.error("Failed to fetch channels:", error);
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

    const newChannel = {
      id: Date.now().toString(),
      name,
      createdAt: new Date().toISOString(),
    };

    const createdChannel = await createChannel(newChannel);
    return NextResponse.json({
      ...createdChannel,
      messages: []
    });
  } catch (error) {
    console.error("Failed to create channel:", error);
    return NextResponse.json({ error: "Failed to create channel" }, { status: 500 });
  }
}
