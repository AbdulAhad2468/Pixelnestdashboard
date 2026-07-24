import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Validation helper
function validateUUID(id: any): string | null {
  if (typeof id !== 'string') return 'ID must be a string';
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) return 'Invalid UUID format';
  return null;
}

// PUT mark message as read
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const idError = validateUUID(id);
    if (idError) {
      return NextResponse.json({ error: idError }, { status: 400 });
    }

    const { error } = await supabase
      .from("private_messages")
      .update({ read: true })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to mark message as read:", error);
    return NextResponse.json({ error: "Failed to mark message as read" }, { status: 500 });
  }
}
