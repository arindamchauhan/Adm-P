import { NextRequest, NextResponse } from 'next/server';
import { sendCustomMessage } from '@/lib/whatsapp';

export async function POST(req: NextRequest) {
  try {
    const { phoneNumber, message } = await req.json();

    if (!phoneNumber || !message) {
      return NextResponse.json(
        { error: 'Phone number and message are required' },
        { status: 400 }
      );
    }

    const result = await sendCustomMessage(phoneNumber, message);

    return NextResponse.json({
      success: result.success,
      ...result
    });
  } catch (error) {
    console.error('Send WhatsApp message error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to send message',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
