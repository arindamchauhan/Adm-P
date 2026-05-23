import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import FAQ from "@/models/FAQ";
import { defaultFaqs } from "@/lib/bijnoor-content";

export async function GET() {
  try {
    await dbConnect();
    const faqs = await FAQ.find({ isActive: true }).sort({ order: 1, createdAt: 1 }).lean();

    if (!faqs.length) {
      return NextResponse.json({ faqs: defaultFaqs });
    }

    const normalized = faqs.map((item) => ({
      question: item.question,
      answer: item.answer,
    }));

    return NextResponse.json({ faqs: normalized });
  } catch {
    return NextResponse.json({ faqs: defaultFaqs });
  }
}
