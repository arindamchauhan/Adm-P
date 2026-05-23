import { NextRequest, NextResponse } from 'next/server';
import { verifyWhatsAppNumber, sendWhatsAppMessage } from '@/lib/whatsapp';
import Customer from '@/models/Customer';
import dbConnect from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { phoneNumber } = await req.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number required' },
        { status: 400 }
      );
    }

    // Verify if on WhatsApp
    const verification = await verifyWhatsAppNumber(phoneNumber);

    if (!verification.available) {
      return NextResponse.json({
        success: false,
        available: false,
        phoneNumber: verification.phoneNumber,
        error: verification.error || 'Number not available on WhatsApp'
      });
    }

    // Update customer in database
    const customer = await Customer.findOneAndUpdate(
      { phone: phoneNumber },
      { 
        whatsappAvailable: true, 
        whatsappVerified: true,
        updatedAt: new Date()
      },
      { new: true, upsert: false }
    );

    if (customer) {
      // Send test message to verify
      const testMessage = '✅ Your phone number has been verified for WhatsApp notifications! You will now receive order updates on this number.';
      await sendWhatsAppMessage(phoneNumber, testMessage);
    }

    return NextResponse.json({
      success: true,
      available: true,
      phoneNumber: verification.phoneNumber,
      carrier: verification.carrier,
      status: 'verified',
      message: 'Phone number verified successfully'
    });
  } catch (error) {
    console.error('WhatsApp verification error:', error);
    return NextResponse.json(
      { 
        error: 'Verification failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
