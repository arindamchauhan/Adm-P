import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import CollabVideo from "@/models/CollabVideo";
import { verifyToken } from "@/lib/auth";
import { recordRealtimeEvent } from "@/lib/realtime";

function getAuthToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return null;
  return authHeader.replace("Bearer ", "");
}

function requireAdmin(request: NextRequest) {
  const token = getAuthToken(request);
  if (!token) return null;
  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== "admin") return null;
  return decoded;
}

export async function PUT(request: NextRequest) {
  try {
    const decoded = requireAdmin(request);
    if (!decoded) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();
    const { ids } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids array is required" }, { status: 400 });
    }

    await Promise.all(
      ids.map((id: string, index: number) =>
        CollabVideo.findByIdAndUpdate(id, { sortOrder: index })
      )
    );

    await recordRealtimeEvent({
      entity: "collab",
      action: "reordered",
      details: { ids },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to reorder collab videos";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
