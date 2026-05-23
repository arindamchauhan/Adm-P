import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { hashPassword, verifyToken } from "@/lib/auth";
import { recordRealtimeEvent } from "@/lib/realtime";

function getAuthToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return null;
  return authHeader.replace("Bearer ", "");
}

async function requireAdmin(request: NextRequest) {
  const token = getAuthToken(request);
  if (!token) return null;
  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== "admin") return null;
  return decoded;
}

export async function GET(request: NextRequest) {
  try {
    const decoded = await requireAdmin(request);
    if (!decoded) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();
    const staff = await User.find({ role: "admin" })
      .select("_id username email firstName lastName isActive createdAt lastLogin")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ staff });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch staff";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const decoded = await requireAdmin(request);
    if (!decoded) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();
    const body = await request.json();

    const username = String(body.username || "").trim().toLowerCase();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const firstName = String(body.firstName || "").trim();
    const lastName = String(body.lastName || "").trim();
    const phone = String(body.phone || "9999999999").trim();

    if (!username || !email || !password || !firstName || !lastName) {
      return NextResponse.json({ error: "username, email, password, firstName and lastName are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const existing = await User.findOne({
      $or: [{ email }, { username }],
    }).lean();

    if (existing) {
      return NextResponse.json({ error: "Email or username already in use" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    const created = await User.create({
      username,
      email,
      passwordHash,
      firstName,
      lastName,
      phone,
      role: "admin",
      isActive: true,
      emailVerified: true,
      permissions: ["staff"],
    });

    await recordRealtimeEvent({
      entity: "staff",
      action: "created",
      resourceId: String(created._id),
      details: { email: created.email, username: created.username },
    });

    return NextResponse.json(
      {
        staff: {
          _id: created._id,
          username: created.username,
          email: created.email,
          firstName: created.firstName,
          lastName: created.lastName,
          isActive: created.isActive,
          createdAt: created.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create staff account";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
