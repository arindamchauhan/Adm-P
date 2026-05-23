import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import AppSettings from "@/models/AppSettings";
import { recordRealtimeEvent } from "@/lib/realtime";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DEFAULT_SETTINGS = {
  supportEmail: "support@bijnoor.com",
  supportPhone: "+919876543210",
  supportWhatsapp: "919999999999",
  contactEmail: "info@bijnoor.com",
};

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

async function getSettings() {
  return AppSettings.findOneAndUpdate(
    { singletonKey: "default" },
    { $setOnInsert: { singletonKey: "default", ...DEFAULT_SETTINGS } },
    { upsert: true, new: true }
  ).lean();
}

export async function GET(request: NextRequest) {
  try {
    const decoded = await requireAdmin(request);
    if (!decoded) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();
    const settings = await getSettings();

    return NextResponse.json({ settings });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load site settings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const decoded = await requireAdmin(request);
    if (!decoded) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();
    const body = await request.json();

    const updates: Record<string, string> = {};

    if (body.supportEmail !== undefined) {
      const value = String(body.supportEmail || "").trim().toLowerCase();
      if (!EMAIL_PATTERN.test(value)) {
        return NextResponse.json({ error: "Enter a valid support email" }, { status: 400 });
      }
      updates.supportEmail = value;
    }

    if (body.supportPhone !== undefined) {
      const value = String(body.supportPhone || "").trim();
      if (!value) {
        return NextResponse.json({ error: "Support phone is required" }, { status: 400 });
      }
      updates.supportPhone = value;
    }

    if (body.supportWhatsapp !== undefined) {
      const value = String(body.supportWhatsapp || "").trim();
      if (!value) {
        return NextResponse.json({ error: "WhatsApp number is required" }, { status: 400 });
      }
      updates.supportWhatsapp = value;
    }

    if (body.contactEmail !== undefined) {
      const value = String(body.contactEmail || "").trim().toLowerCase();
      if (!EMAIL_PATTERN.test(value)) {
        return NextResponse.json({ error: "Enter a valid contact email" }, { status: 400 });
      }
      updates.contactEmail = value;
    }

    const settings = (await AppSettings.findOneAndUpdate(
      { singletonKey: "default" },
      {
        $setOnInsert: { singletonKey: "default", ...DEFAULT_SETTINGS },
        $set: {
          ...updates,
          updatedBy: decoded.userId,
        },
      },
      { upsert: true, new: true }
    ).lean()) as {
      supportEmail?: string;
      supportPhone?: string;
      supportWhatsapp?: string;
      contactEmail?: string;
    } | null;

    await recordRealtimeEvent({
      entity: "site-settings",
      action: "updated",
      details: {
        supportEmail: settings?.supportEmail,
        supportPhone: settings?.supportPhone,
        supportWhatsapp: settings?.supportWhatsapp,
        contactEmail: settings?.contactEmail,
      },
    });

    return NextResponse.json({ settings, message: "Settings updated successfully" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update site settings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
