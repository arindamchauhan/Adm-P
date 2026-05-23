import { NextRequest, NextResponse } from 'next/server';
import { verifyWhatsAppNumber } from '@/lib/whatsapp';
import Customer from '@/models/Customer';
import dbConnect from '@/lib/db';

// Simple admin token verification (in production, use proper JWT)
function verifyAdminToken(token: string | null): boolean {
  if (!token) return false;
  // This is a placeholder - in production, verify against actual JWT
  // For now, we'll check if token exists and is not empty
  return token.length > 0;
}

export async function POST(req: NextRequest) {
  try {
    // Verify admin
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    
    if (!token || !verifyAdminToken(token)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin token required' },
        { status: 401 }
      );
    }

    await dbConnect();
    const { phoneNumbers } = await req.json();

    if (!Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
      return NextResponse.json(
        { error: 'Phone numbers array required' },
        { status: 400 }
      );
    }

    // Limit batch size to prevent abuse
    if (phoneNumbers.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 phone numbers per request' },
        { status: 400 }
      );
    }

    console.log(`Batch verifying ${phoneNumbers.length} phone numbers...`);

    // Verify all numbers in parallel (max 10 concurrent to avoid Twilio rate limits)
    const verifications = [];
    for (let i = 0; i < phoneNumbers.length; i += 10) {
      const batch = phoneNumbers.slice(i, i + 10);
      const batchResults = await Promise.all(
        batch.map(async (phone) => {
          const result = await verifyWhatsAppNumber(phone);
          
          // Update customer record if available
          if (result.available) {
            await Customer.updateOne(
              { phone: phone },
              { 
                whatsappAvailable: true, 
                whatsappVerified: true,
                updatedAt: new Date()
              }
            );
          }

          return {
            phone: phone,
            available: result.available,
            carrier: result.carrier,
            status: result.status || (result.available ? 'verified' : 'failed')
          };
        })
      );
      verifications.push(...batchResults);
    }

    const available = verifications.filter(v => v.available);
    const unavailable = verifications.filter(v => !v.available);

    console.log(`✅ Batch verification complete: ${available.length} verified, ${unavailable.length} failed`);

    return NextResponse.json({
      success: true,
      total: phoneNumbers.length,
      verified: available.length,
      failed: unavailable.length,
      verifiedNumbers: available,
      failedNumbers: unavailable
    });
  } catch (error) {
    console.error('Batch verification error:', error);
    return NextResponse.json(
      { 
        error: 'Batch verification failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
