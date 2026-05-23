import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import AbandonmentLead from "@/models/AbandonmentLead";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();

    const preferredChannel = String(body?.preferredChannel || "").toLowerCase();
    const intentSource = String(body?.intentSource || "exit_intent").toLowerCase();

    if (!["whatsapp", "email"].includes(preferredChannel)) {
      return NextResponse.json({ error: "Invalid preferred channel" }, { status: 400 });
    }

    if (!["exit_intent", "before_unload", "inactivity"].includes(intentSource)) {
      return NextResponse.json({ error: "Invalid intent source" }, { status: 400 });
    }

    const lead = await AbandonmentLead.create({
      fullName: body?.fullName ? String(body.fullName).trim() : undefined,
      phoneNumber: body?.phoneNumber ? String(body.phoneNumber).replace(/\D/g, "") : undefined,
      emailAddress: body?.emailAddress ? String(body.emailAddress).trim().toLowerCase() : undefined,
      pincode: body?.pincode ? String(body.pincode).trim() : undefined,
      preferredChannel,
      intentSource,
      message: body?.message ? String(body.message).trim() : undefined,
    });

    return NextResponse.json({ id: String(lead._id), message: "Lead captured" }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save abandonment lead";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
