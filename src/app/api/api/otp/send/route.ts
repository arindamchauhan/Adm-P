import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import OtpVerification from "@/models/OtpVerification";
import {
  normalizePhoneNumber,
  isValidPhoneNumber,
  generateOTPCode,
  getOTPExpiryTime,
  sendOTPViaSMS,
  getSMSProvider,
} from "@/lib/otp-service";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const phoneNumber = String(body?.phoneNumber || "").trim();

    // Validate and normalize phone number
    if (!isValidPhoneNumber(phoneNumber)) {
      return NextResponse.json(
        { error: "Invalid phone number. Please enter a valid 10-digit number." },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhoneNumber(phoneNumber);

    // Check if there's a recent OTP request to prevent spam
    const recentOTP = await OtpVerification.findOne({
      phoneNumber: normalizedPhone,
      createdAt: {
        $gte: new Date(Date.now() - 60000), // Within last 60 seconds
      },
    });

    if (recentOTP && !recentOTP.isVerified) {
      return NextResponse.json(
        {
          error: "Please wait before requesting a new OTP",
          retryAfter: 60,
          requestId: recentOTP.requestId,
          expiresAt: recentOTP.expiresAt,
        },
        { status: 429 }
      );
    }

    // Generate OTP and request ID
    const otpCode = generateOTPCode(6);
    const requestId = crypto.randomUUID();
    const expiresAt = getOTPExpiryTime(5);

    // Save OTP to database
    const otpRecord = await OtpVerification.create({
      requestId,
      phoneNumber: normalizedPhone,
      otpCode,
      isVerified: false,
      expiresAt,
    });

    // Send OTP via SMS provider
    const smsProvider = getSMSProvider();
    let smsSendResult = { success: false, error: "SMS provider not configured" };

    if (smsProvider !== "mock") {
      smsSendResult = await sendOTPViaSMS(normalizedPhone, otpCode);

      if (!smsSendResult.success) {
        // Delete the OTP record if SMS sending failed
        await OtpVerification.deleteOne({ _id: otpRecord._id });

        return NextResponse.json(
          {
            error: "Failed to send OTP. Please try again.",
            details: process.env.NODE_ENV !== "production" ? smsSendResult.error : undefined,
          },
          { status: 500 }
        );
      }
    }

    const response: Record<string, unknown> = {
      requestId,
      expiresAt,
      message: "OTP sent successfully",
      smsSent: smsProvider !== "mock",
      phoneNumber: `****${normalizedPhone.slice(-4)}`,
    };

    // Include OTP in development mode for testing
    if (process.env.NODE_ENV !== "production") {
      response.devOtp = otpCode;
      response.message = `[DEV] OTP: ${otpCode} (will expire at ${expiresAt.toISOString()})`;
    }

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("[OTP Send] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to send OTP";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
