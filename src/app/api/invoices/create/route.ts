import { NextRequest, NextResponse } from 'next/server';
import Invoice from '@/models/Invoice';
import dbConnect from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { orderId, customerId, items, tax = 0, shipping = 0, discount = 0, paymentMethod = 'COD' } = await req.json();

    if (!orderId || !customerId || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'orderId, customerId, and items array are required' },
        { status: 400 }
      );
    }

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.total || item.quantity * item.price), 0);
    const grandTotal = subtotal + tax + shipping - discount;

    // Generate bill number (format: INV-YYYY-0001)
    const count = await Invoice.countDocuments();
    const year = new Date().getFullYear();
    const billNumber = `INV-${year}-${String(count + 1).padStart(4, '0')}`;

    const invoice = new Invoice({
      billNumber,
      orderId,
      customerId,
      items,
      subtotal,
      tax,
      shipping,
      discount,
      grandTotal,
      billedDate: new Date(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days due date
      status: 'sent',
      paymentMethod
    });

    await invoice.save();

    return NextResponse.json({
      success: true,
      billNumber: invoice.billNumber,
      billId: invoice._id,
      grandTotal: invoice.grandTotal,
      invoice
    });
  } catch (error) {
    console.error('Invoice creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    );
  }
}
