import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Subscriber from "@/models/Subscriber";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const email = String(body?.email || "").trim().toLowerCase();

    if (!EMAIL_PATTERN.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const existing = await Subscriber.findOne({ email });
    if (existing) {
      if (!existing.isActive) {
        await Subscriber.updateOne({ _id: existing._id }, { $set: { isActive: true } });
      }
      return NextResponse.json({ message: "Already subscribed" });
    }

    await Subscriber.create({ email, isActive: true });
    return NextResponse.json({ message: "Subscription successful" }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save subscriber";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
