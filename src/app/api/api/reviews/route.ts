import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Review from "@/models/Review";
import { defaultReviews } from "@/lib/bijnoor-content";

export async function GET() {
  try {
    await dbConnect();
    const reviews = await Review.find({ isApproved: true }).sort({ createdAt: -1 }).lean();

    if (!reviews.length) {
      return NextResponse.json({ reviews: defaultReviews });
    }

    const normalized = reviews.map((item) => ({
      id: String(item._id),
      name: item.name,
      rating: item.rating,
      text: item.text,
      source: item.source,
      location: item.location,
      instagramVideoUrl: item.instagramVideoUrl,
    }));

    return NextResponse.json({ reviews: normalized });
  } catch {
    return NextResponse.json({ reviews: defaultReviews });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const name = String(body?.name || "").trim();
    const text = String(body?.text || "").trim();
    const source = String(body?.source || "Written review").trim();
    const location = body?.location ? String(body.location).trim() : undefined;
    const rating = Number(body?.rating || 0);
    const instagramVideoUrl =
      body?.instagramVideoUrl && String(body.instagramVideoUrl).trim().length > 0
        ? String(body.instagramVideoUrl).trim()
        : undefined;

    if (!name || !text || Number.isNaN(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Invalid review payload" }, { status: 400 });
    }

    const review = await Review.create({
      name,
      text,
      source,
      location,
      rating,
      instagramVideoUrl,
      isApproved: true,
    });

    return NextResponse.json(
      {
        review: {
          id: String(review._id),
          name: review.name,
          rating: review.rating,
          text: review.text,
          source: review.source,
          location: review.location,
          instagramVideoUrl: review.instagramVideoUrl,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to submit review";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
