import { NextRequest, NextResponse } from 'next/server';
import Customer from '@/models/Customer';
import dbConnect from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { name, email, phone, address, city, state, pincode } = await req.json();

    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Name and phone are required' },
        { status: 400 }
      );
    }

    // Check if customer already exists
    const existingCustomer = await Customer.findOne({ phone });
    if (existingCustomer) {
      return NextResponse.json(
        { error: 'Customer with this phone number already exists' },
        { status: 409 }
      );
    }

    // Create new customer
    const customer = new Customer({
      name,
      email,
      phone,
      address,
      city,
      state,
      pincode,
      createdFrom: 'website'
    });

    await customer.save();

    return NextResponse.json({
      success: true,
      customerId: customer._id,
      message: 'Customer registered successfully',
      customer
    });
  } catch (error) {
    console.error('Customer registration error:', error);
    return NextResponse.json(
      { error: 'Failed to register customer' },
      { status: 500 }
    );
  }
}
