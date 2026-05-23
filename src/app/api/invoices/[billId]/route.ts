import { NextRequest, NextResponse } from 'next/server';
import Invoice from '@/models/Invoice';
import dbConnect from '@/lib/db';
import mongoose from 'mongoose';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ billId: string }> }
) {
  try {
    await dbConnect();

    const { billId } = await params;

    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(billId)) {
      return NextResponse.json(
        { error: 'Invalid bill ID' },
        { status: 400 }
      );
    }

    const invoice = await Invoice.findById(billId)
      .populate('orderId')
      .populate('customerId');

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      invoice
    });
  } catch (error) {
    console.error('Fetch invoice error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoice' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ billId: string }> }
) {
  try {
    await dbConnect();

    const { billId } = await params;
    const updates = await req.json();

    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(billId)) {
      return NextResponse.json(
        { error: 'Invalid bill ID' },
        { status: 400 }
      );
    }

    // Don't allow updating these fields
    delete updates._id;
    delete updates.createdAt;
    delete updates.billNumber;

    const invoice = await Invoice.findByIdAndUpdate(
      billId,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Invoice updated successfully',
      invoice
    });
  } catch (error) {
    console.error('Update invoice error:', error);
    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    );
  }
}
