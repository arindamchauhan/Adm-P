import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import OtpVerification from "@/models/OtpVerification";
import {
  isValidOTP,
  verifyOTPCode,
  generateVerificationToken,
  isOTPExpired,
} from "@/lib/otp-service";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const requestId = String(body?.requestId || "").trim();
    const otpCode = String(body?.otpCode || "").trim();

    // Validate inputs
    if (!requestId) {
      return NextResponse.json(
        { error: "Request ID is required" },
        { status: 400 }
      );
    }

    if (!isValidOTP(otpCode)) {
      return NextResponse.json(
        { error: "Invalid OTP format. Please enter a 6-digit code." },
        { status: 400 }
      );
    }

    // Find the OTP record
    const verification = await OtpVerification.findOne({ requestId });

    if (!verification) {
      return NextResponse.json(
        { error: "OTP session not found. Please request a new OTP." },
        { status: 404 }
      );
    }

    // If already verified, return the existing token
    if (verification.isVerified && verification.verificationToken) {
      return NextResponse.json({
        verificationToken: verification.verificationToken,
        phoneNumber: verification.phoneNumber,
        verifiedAt: verification.verifiedAt,
        message: "Phone already verified",
      });
    }

    // Check if OTP is expired
    const expired = isOTPExpired(verification.expiresAt);
    if (expired) {
      return NextResponse.json(
        { error: "OTP expired. Please request a new one." },
        { status: 410 }
      );
    }

    // Verify OTP code
    const otpVerification = verifyOTPCode(
      verification.otpCode,
      otpCode,
      expired
    );

    if (!otpVerification.valid) {
      // Increment failed attempts (for security)
      verification.failedAttempts = (verification.failedAttempts || 0) + 1;

      if (verification.failedAttempts >= 5) {
        // Lock the request after 5 failed attempts
        verification.isLocked = true;
        await verification.save();

        return NextResponse.json(
          {
            error: "Too many incorrect attempts. Please request a new OTP.",
            locked: true,
          },
          { status: 429 }
        );
      }

      await verification.save();
      return NextResponse.json(
        {
          error: otpVerification.error || "Incorrect OTP",
          attemptsRemaining: 5 - verification.failedAttempts,
        },
        { status: 401 }
      );
    }

    // Mark as verified
    const verificationToken = generateVerificationToken();
    verification.isVerified = true;
    verification.verificationToken = verificationToken;
    verification.verifiedAt = new Date();
    verification.failedAttempts = 0;
    await verification.save();

    return NextResponse.json({
      verificationToken,
      phoneNumber: verification.phoneNumber,
      verifiedAt: verification.verifiedAt,
      message: "Phone number verified successfully",
    });
  } catch (error: unknown) {
    console.error("[OTP Verify] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to verify OTP";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
