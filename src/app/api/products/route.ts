import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";
import { verifyToken } from "@/lib/auth";
import { slugify } from "@/lib/slug";
import { PRODUCTS } from "@/lib/products";
import { recordRealtimeEvent } from "@/lib/realtime";

function getAuthToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return null;
  return authHeader.replace("Bearer ", "");
}

async function seedProductsIfEmpty() {
  const count = await Product.countDocuments();

  const seedData = PRODUCTS.map((p, index) => ({
    name: p.name,
    slug: slugify(p.name),
    description: p.description,
    shortDescription: p.description,
    price: p.price,
    launchSoon: Boolean(p.launchSoon),
    category: p.category,
    images: [{ url: p.image, altText: p.name, isPrimary: true }],
    sku: `SKU-${String(index + 1).padStart(3, "0")}`,
    stock: p.stock,
    ingredients: p.ingredients,
    benefits: p.benefits,
    isActive: true,
    isPublished: true,
    rating: 4.5,
    reviewCount: 0,
  }));

  if (count === 0) {
    await Product.insertMany(seedData);
    return;
  }

  for (const item of seedData) {
    const exists = await Product.findOne({ slug: item.slug }).select("_id");
    if (!exists) {
      await Product.create(item);
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    await seedProductsIfEmpty();

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const category = searchParams.get("category") || "";
    const minPrice = Number(searchParams.get("minPrice") || 0);
    const maxPrice = Number(searchParams.get("maxPrice") || Number.MAX_SAFE_INTEGER);
    const sort = searchParams.get("sort") || "latest";
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || 12)));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {
      isActive: true,
      isPublished: true,
      price: { $gte: minPrice, $lte: maxPrice },
    };

    if (q) {
      query.$or = [
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ];
    }

    if (category && category !== "all") {
      query.category = category;
    }

    const sortMap: Record<string, Record<string, 1 | -1>> = {
      latest: { createdAt: -1 },
      "price-asc": { price: 1 },
      "price-desc": { price: -1 },
      popularity: { sales: -1, views: -1 },
      rating: { rating: -1 },
    };

    const [products, total] = await Promise.all([
      Product.find(query).sort(sortMap[sort] || sortMap.latest).skip(skip).limit(limit).lean(),
      Product.countDocuments(query),
    ]);

    return NextResponse.json({
      products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch products";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();
    const payload = await request.json();

    const requiredFields = ["name", "description", "price", "category"];
    const missing = requiredFields.filter((f) => !payload[f]);
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    const slug = payload.slug ? slugify(payload.slug) : slugify(payload.name);
    const existingBySlug = await Product.findOne({ slug });
    if (existingBySlug) {
      return NextResponse.json({ error: "Product slug already exists" }, { status: 409 });
    }

    const product = await Product.create({
      ...payload,
      slug,
      sku: payload.sku || `SKU-${Date.now()}`,
      images: payload.images?.length
        ? payload.images
        : [{ url: payload.image || "", altText: payload.name, isPrimary: true }],
      isPublished: payload.isPublished ?? true,
      isActive: payload.isActive ?? true,
      createdBy: decoded.userId,
    });

    await recordRealtimeEvent({
      entity: "product",
      action: "created",
      resourceId: String(product._id),
      details: { slug: product.slug },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create product";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
