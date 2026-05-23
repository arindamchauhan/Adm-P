import { NextRequest, NextResponse } from 'next/server';
import Invoice from '@/models/Invoice';
import dbConnect from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';

    // Build filter
    const filter: any = {};
    if (status) {
      filter.status = status;
    }
    if (search) {
      filter.$or = [
        { billNumber: { $regex: search, $options: 'i' } },
        { 'items.productName': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    // Get total count
    const total = await Invoice.countDocuments(filter);

    // Get invoices with pagination
    const invoices = await Invoice.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('customerId', 'name phone email')
      .select('-__v');

    // Calculate totals
    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);

    return NextResponse.json({
      success: true,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      totalRevenue,
      invoices
    });
  } catch (error) {
    console.error('Fetch invoices error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}
