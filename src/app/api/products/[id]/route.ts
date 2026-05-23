import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";
import { verifyToken } from "@/lib/auth";
import { slugify } from "@/lib/slug";
import { recordRealtimeEvent } from "@/lib/realtime";

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

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    const lookupFilter = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { slug: id }] }
      : { slug: id };

    const product: any = await (Product as any).findOne({
      ...lookupFilter,
      isActive: true,
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await Product.updateOne({ _id: product._id }, { $inc: { views: 1 } });
    return NextResponse.json({ product: product.toObject() });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch product";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = await requireAdmin(request);
    if (!decoded) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();
    const { id } = await params;
    const payload = await request.json();

    if (payload.name && !payload.slug) {
      payload.slug = slugify(payload.name);
    }
    if (payload.slug) {
      payload.slug = slugify(payload.slug);
    }

    const product = await Product.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    }).lean();

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await recordRealtimeEvent({
      entity: "product",
      action: "updated",
      resourceId: String(product._id),
      details: { slug: product.slug },
    });

    return NextResponse.json({ product });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update product";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = await requireAdmin(request);
    if (!decoded) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();
    const { id } = await params;
    const product = await Product.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    ).lean();

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await recordRealtimeEvent({
      entity: "product",
      action: "deleted",
      resourceId: String(product._id),
      details: { slug: product.slug },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete product";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
