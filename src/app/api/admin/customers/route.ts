import { NextRequest, NextResponse } from 'next/server';
import Customer from '@/models/Customer';
import dbConnect from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // Get query parameters for pagination and filters
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const whatsappOnly = searchParams.get('whatsappOnly') === 'true';

    // Build filter
    const filter: any = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (whatsappOnly) {
      filter.whatsappVerified = true;
    }

    const skip = (page - 1) * limit;

    // Get total count
    const total = await Customer.countDocuments(filter);

    // Get customers with pagination
    const customers = await Customer.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v');

    return NextResponse.json({
      success: true,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      customers
    });
  } catch (error) {
    console.error('Fetch customers error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}
