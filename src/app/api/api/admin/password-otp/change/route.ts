import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import AdminEmailOtp from "@/models/AdminEmailOtp";
import { comparePassword, hashPassword, verifyToken } from "@/lib/auth";

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

    const body = await request.json();
    const requestId = String(body.requestId || "").trim();
    const otpCode = String(body.otpCode || "").trim();
    const currentPassword = String(body.currentPassword || "");
    const newPassword = String(body.newPassword || "");

    if (!requestId || !/^\d{6}$/.test(otpCode) || !currentPassword || !newPassword) {
      return NextResponse.json({ error: "requestId, otpCode, currentPassword and newPassword are required" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
    }

    const adminUser = await User.findById(decoded.userId).select("email passwordHash");
    if (!adminUser) {
      return NextResponse.json({ error: "Admin account not found" }, { status: 404 });
    }

    const otpDoc = await AdminEmailOtp.findOne({
      requestId,
      email: adminUser.email,
      purpose: "change_password",
      isUsed: false,
    });

    if (!otpDoc) {
      return NextResponse.json({ error: "OTP session not found" }, { status: 404 });
    }

    if (new Date(otpDoc.expiresAt).getTime() < Date.now()) {
      return NextResponse.json({ error: "OTP expired. Request a new one." }, { status: 410 });
    }

    if (otpDoc.otpCode !== otpCode) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 401 });
    }

    const isCurrentPasswordValid = await comparePassword(currentPassword, adminUser.passwordHash);
    if (!isCurrentPasswordValid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
    }

    adminUser.passwordHash = await hashPassword(newPassword);
    await adminUser.save();

    otpDoc.isUsed = true;
    otpDoc.usedAt = new Date();
    await otpDoc.save();

    return NextResponse.json({ success: true, message: "Password updated successfully" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to change password";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
