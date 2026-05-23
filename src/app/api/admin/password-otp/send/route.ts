import { randomInt, randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import AdminEmailOtp from "@/models/AdminEmailOtp";
import { verifyToken } from "@/lib/auth";

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

export async function POST(request: NextRequest) {
  try {
    const decoded = await requireAdmin(request);
    if (!decoded) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();

    const adminUserResult = await (User as any)
      .find({ _id: decoded.userId })
      .select("email")
      .limit(1)
      .lean();

    const adminEmail = Array.isArray(adminUserResult)
      ? String(adminUserResult[0]?.email || "")
      : String((adminUserResult as any)?.email || "");

    if (!adminEmail) {
      return NextResponse.json({ error: "Admin account email not found" }, { status: 404 });
    }

    const otpCode = String(randomInt(100000, 999999));
    const requestId = randomUUID();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await AdminEmailOtp.create({
      email: adminEmail,
      otpCode,
      requestId,
      purpose: "change_password",
      expiresAt,
      isUsed: false,
    });

    // Email integration can be plugged here. In dev, return otp for testing.
    return NextResponse.json({
      message: "OTP sent to admin email",
      requestId,
      email: adminEmail,
      ...(process.env.NODE_ENV !== "production" ? { devOtp: otpCode } : {}),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to send OTP";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
