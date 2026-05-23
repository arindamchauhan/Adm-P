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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = requireAdmin(request);
    if (!decoded) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();
    const { id } = await params;
    const payload = await request.json();

    const collab = await CollabVideo.findByIdAndUpdate(
      id,
      {
        ...(payload.creatorName !== undefined ? { creatorName: String(payload.creatorName).trim() } : {}),
        ...(payload.instagramUrl !== undefined ? { instagramUrl: String(payload.instagramUrl).trim() } : {}),
        ...(payload.thumbnailUrl !== undefined ? { thumbnailUrl: String(payload.thumbnailUrl).trim() } : {}),
        ...(payload.caption !== undefined ? { caption: String(payload.caption).trim() } : {}),
        ...(payload.viewsLabel !== undefined ? { viewsLabel: String(payload.viewsLabel).trim() } : {}),
        ...(payload.sortOrder !== undefined ? { sortOrder: Number(payload.sortOrder) } : {}),
        ...(payload.isActive !== undefined ? { isActive: Boolean(payload.isActive) } : {}),
      },
      { new: true, runValidators: true }
    ).lean();

    if (!collab) {
      return NextResponse.json({ error: "Collab video not found" }, { status: 404 });
    }

    await recordRealtimeEvent({
      entity: "collab",
      action: "updated",
      resourceId: String(collab._id),
      details: { creatorName: collab.creatorName },
    });

    return NextResponse.json({ collab });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update collab video";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = requireAdmin(request);
    if (!decoded) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();
    const { id } = await params;

    const collab = await CollabVideo.findByIdAndDelete(id).lean();
    if (!collab) {
      return NextResponse.json({ error: "Collab video not found" }, { status: 404 });
    }

    await recordRealtimeEvent({
      entity: "collab",
      action: "deleted",
      resourceId: String(collab._id),
      details: { creatorName: collab.creatorName },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete collab video";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
