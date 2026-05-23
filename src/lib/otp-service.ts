import { randomInt, randomUUID } from "crypto";

export interface SendOTPOptions {
  phoneNumber: string;
  countryCode?: string;
  expiryMinutes?: number;
  otpLength?: number;
}

export interface OTPResponse {
  requestId: string;
  expiresAt: Date;
  message: string;
  devOtp?: string;
}

export interface VerifyOTPOptions {
  requestId: string;
  otpCode: string;
}

export interface VerifyOTPResponse {
  verificationToken: string;
  phoneNumber: string;
  verifiedAt: Date;
}

/**
 * Normalize phone number to 10-digit format (removes country code if present)
 */
export function normalizePhoneNumber(phoneNumber: string): string {
  // Remove all non-digits
  const digits = phoneNumber.replace(/\D/g, "");

  // If it starts with 91 (India country code) and is 12 digits, remove 91
  if (digits.startsWith("91") && digits.length === 12) {
    return digits.slice(2);
  }

  // If it's already 10 digits, return as is
  if (digits.length === 10) {
    return digits;
  }

  // Return last 10 digits for any other format
  return digits.slice(-10);
}

/**
 * Generate a random OTP code
 */
export function generateOTPCode(length: number = 6): string {
  if (length === 6) {
    return String(randomInt(100000, 999999));
  }
  return String(randomInt(10 ** (length - 1), 10 ** length - 1));
}

/**
 * Validate OTP format
 */
export function isValidOTP(otp: string, length: number = 6): boolean {
  return new RegExp(`^\\d{${length}}$`).test(otp.trim());
}

/**
 * Validate phone number format
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
  const normalized = normalizePhoneNumber(phoneNumber);
  return /^\d{10}$/.test(normalized);
}

/**
 * Format phone number with country code for SMS delivery
 */
export function formatPhoneForSMS(phoneNumber: string, countryCode: string = "+91"): string {
  const normalized = normalizePhoneNumber(phoneNumber);
  if (!isValidPhoneNumber(normalized)) {
    throw new Error("Invalid phone number");
  }
  return `${countryCode}${normalized}`;
}

/**
 * Get SMS provider from environment
 */
export function getSMSProvider(): "msg91" | "firebase" | "mock" {
  const provider = process.env.OTP_SMS_PROVIDER || "mock";
  if (!["msg91", "firebase", "mock"].includes(provider)) {
    return "mock";
  }
  return provider as "msg91" | "firebase" | "mock";
}

/**
 * Send OTP via configured SMS provider
 */
export async function sendOTPViaSMS(
  phoneNumber: string,
  otpCode: string,
  countryCode: string = "+91"
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const provider = getSMSProvider();
  const formattedPhone = formatPhoneForSMS(phoneNumber, countryCode);

  // Log for development
  console.log(
    `[OTP Service] Sending OTP via ${provider} to ${formattedPhone} (development mode: ${process.env.NODE_ENV !== "production"})`
  );

  try {
    if (provider === "msg91") {
      return await sendViaMsg91(formattedPhone, otpCode);
    } else if (provider === "firebase") {
      // Firebase is handled at the client-side level
      return {
        success: true,
        messageId: `firebase-${randomUUID()}`,
      };
    } else {
      // Mock provider for development
      return {
        success: true,
        messageId: `mock-${randomUUID()}`,
      };
    }
  } catch (error) {
    console.error(`[OTP Service] Error sending OTP via ${provider}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send OTP",
    };
  }
}

/**
 * Send OTP via MSG91 SMS provider
 */
async function sendViaMsg91(phoneNumber: string, otpCode: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const authKey = process.env.MSG91_AUTH_KEY;
  const routeId = process.env.MSG91_ROUTE_ID || "1";
  const senderId = process.env.MSG91_SENDER_ID || "BIJNOOR";

  if (!authKey) {
    throw new Error("MSG91_AUTH_KEY not configured");
  }

  const message = `Your BijNoor verification code is ${otpCode}. This code expires in 5 minutes.`;

  try {
    const response = await fetch("https://api.msg91.com/apiv5/flow/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authkey: authKey,
      },
      body: JSON.stringify({
        route: routeId,
        sender_id: senderId,
        mobile: phoneNumber.replace("+", ""),
        message: message,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.type || data.type === "error") {
      throw new Error(data.message || "MSG91 API error");
    }

    return {
      success: true,
      messageId: data.request_id || `msg91-${randomUUID()}`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "MSG91 request failed";
    console.error(`[MSG91] Error: ${message}`);
    throw new Error(`MSG91 Error: ${message}`);
  }
}

/**
 * Verify OTP code format and values
 */
export function verifyOTPCode(storedOTP: string, providedOTP: string, isExpired: boolean): { valid: boolean; error?: string } {
  if (isExpired) {
    return { valid: false, error: "OTP expired. Please request a new one." };
  }

  if (!isValidOTP(providedOTP)) {
    return { valid: false, error: "Invalid OTP format." };
  }

  if (storedOTP !== providedOTP.trim()) {
    return { valid: false, error: "Incorrect OTP. Please try again." };
  }

  return { valid: true };
}

/**
 * Generate verification token for successful OTP verification
 */
export function generateVerificationToken(): string {
  return randomUUID();
}

/**
 * Create OTP expiry time
 */
export function getOTPExpiryTime(expiryMinutes: number = 5): Date {
  return new Date(Date.now() + expiryMinutes * 60 * 1000);
}

/**
 * Check if OTP is expired
 */
export function isOTPExpired(expiresAt: Date): boolean {
  return new Date(expiresAt).getTime() < Date.now();
}
