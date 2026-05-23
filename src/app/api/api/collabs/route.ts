import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import CollabVideo from "@/models/CollabVideo";
import { verifyToken } from "@/lib/auth";
import { COLLAB_VIDEOS } from "@/lib/collabVideos";
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

async function seedCollabsIfEmpty() {
  const count = await CollabVideo.countDocuments();
  if (count > 0) return;

  const seed = COLLAB_VIDEOS.map((item, index) => ({
    creatorName: item.creatorName,
    instagramUrl: item.instagramUrl,
    thumbnailUrl: item.thumbnailUrl,
    caption: item.caption,
    viewsLabel: item.viewsLabel,
    sortOrder: index,
    isActive: true,
  }));

  await CollabVideo.insertMany(seed);
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    await seedCollabsIfEmpty();

    const includeInactive = request.nextUrl.searchParams.get("includeInactive") === "true";
    if (includeInactive) {
      const decoded = requireAdmin(request);
      if (!decoded) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const query = includeInactive ? {} : { isActive: true };

    const collabs = await CollabVideo.find(query)
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean();

    return NextResponse.json({ collabs });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch collab videos";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const decoded = requireAdmin(request);
    if (!decoded) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();
    const payload = await request.json();

    if (!payload.creatorName || !payload.instagramUrl || !payload.thumbnailUrl || !payload.caption) {
      return NextResponse.json(
        { error: "creatorName, instagramUrl, thumbnailUrl, and caption are required" },
        { status: 400 }
      );
    }

    const maxOrder: any = await (CollabVideo as any)
      .findOne({})
      .sort({ sortOrder: -1 })
      .select("sortOrder")
      .lean();

    const collab = await CollabVideo.create({
      creatorName: String(payload.creatorName).trim(),
      instagramUrl: String(payload.instagramUrl).trim(),
      thumbnailUrl: String(payload.thumbnailUrl).trim(),
      caption: String(payload.caption).trim(),
      viewsLabel: payload.viewsLabel ? String(payload.viewsLabel).trim() : undefined,
      sortOrder: typeof payload.sortOrder === "number" ? payload.sortOrder : (maxOrder?.sortOrder ?? -1) + 1,
      isActive: payload.isActive ?? true,
    });

    await recordRealtimeEvent({
      entity: "collab",
      action: "created",
      resourceId: String(collab._id),
      details: { creatorName: collab.creatorName },
    });

    return NextResponse.json({ collab }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create collab video";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
