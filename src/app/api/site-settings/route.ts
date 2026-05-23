import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import AppSettings from "@/models/AppSettings";

const DEFAULT_SETTINGS = {
  supportEmail: "support@bijnoor.com",
  supportPhone: "+919876543210",
  supportWhatsapp: "919999999999",
  contactEmail: "info@bijnoor.com",
};

export async function GET() {
  try {
    await dbConnect();
    const settings = await AppSettings.findOneAndUpdate(
      { singletonKey: "default" },
      { $setOnInsert: { singletonKey: "default", ...DEFAULT_SETTINGS } },
      { upsert: true, new: true }
    )
      .select("supportEmail supportPhone supportWhatsapp contactEmail")
      .lean();

    return NextResponse.json({ settings });
  } catch {
    return NextResponse.json({ settings: DEFAULT_SETTINGS });
  }
}
