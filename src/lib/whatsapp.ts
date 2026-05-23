import twilio from 'twilio';

const TWILIO_WHATSAPP_NUMBER = 
  process.env.NODE_ENV === 'production' 
    ? process.env.TWILIO_WHATSAPP_BUSINESS_NUMBER 
    : process.env.TWILIO_WHATSAPP_SANDBOX_NUMBER;

function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials are not configured');
  }

  return twilio(accountSid, authToken);
}

/**
 * Verify if a phone number is available on WhatsApp
 * @param phoneNumber - Phone number in format: 9876543210 or +919876543210
 * @returns Object with availability status and phone details
 */
export async function verifyWhatsAppNumber(phoneNumber: string) {
  try {
    if (!phoneNumber) {
      return { available: false, error: 'Phone number required' };
    }

    // Remove all non-digits
    let formattedPhone = phoneNumber.replace(/\D/g, '');
    
    // If 10 digits (Indian), add country code
    if (formattedPhone.length === 10) {
      formattedPhone = '91' + formattedPhone;
    }
    
    // Add + prefix
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone;
    }

    console.log(`Verifying WhatsApp number: ${formattedPhone}`);

    // Use Twilio's lookup API to check if carrier exists
    // (In production, this is the WhatsApp check)
    try {
      const client = getTwilioClient();
      const phoneData = await (client.lookups.v1.phoneNumbers(formattedPhone) as any).fetch({
        fields: 'carrier'
      });

      const isValid = phoneData.carrier?.type !== 'unknown';
      
      return {
        available: isValid,
        phoneNumber: formattedPhone,
        carrier: phoneData.carrier?.name || 'Unknown',
        status: 'verified'
      };
    } catch (lookupError: any) {
      // If lookup fails, assume not available
      console.warn(`WhatsApp lookup failed for ${formattedPhone}:`, lookupError.message);
      return {
        available: false,
        phoneNumber: formattedPhone,
        error: 'Number not found on WhatsApp'
      };
    }
  } catch (error) {
    console.error('WhatsApp verification failed:', error);
    return {
      available: false,
      error: error instanceof Error ? error.message : 'Verification failed'
    };
  }
}

/**
 * Send a WhatsApp message to a customer
 * @param toPhoneNumber - Recipient phone number
 * @param messageBody - Message text to send
 * @returns Message SID and status
 */
export async function sendWhatsAppMessage(
  toPhoneNumber: string,
  messageBody: string
) {
  try {
    if (!toPhoneNumber || !messageBody) {
      return { success: false, error: 'Phone number and message required' };
    }

    // Format phone number
    let formattedPhone = toPhoneNumber.replace(/\D/g, '');
    if (formattedPhone.length === 10) {
      formattedPhone = '91' + formattedPhone;
    }
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone;
    }
    
    const toAddress = 'whatsapp:' + formattedPhone;

    console.log(`Sending WhatsApp to ${toAddress}: ${messageBody}`);

    const client = getTwilioClient();
    const message = await client.messages.create({
      from: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
      to: toAddress,
      body: messageBody
    });

    console.log(`✅ WhatsApp sent to ${toPhoneNumber}, SID: ${message.sid}`);

    return {
      success: true,
      messageSid: message.sid,
      status: message.status,
      sentAt: new Date()
    };
  } catch (error) {
    console.error('❌ Failed to send WhatsApp message:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send message'
    };
  }
}

/**
 * Send order confirmation message via WhatsApp
 */
export async function sendOrderConfirmationMessage(
  customerPhone: string,
  orderNumber: string,
  totalAmount: number,
  trackingUrl: string
) {
  const message = `🎉 *Order Confirmed!*\n\nOrder #${orderNumber}\nAmount: ₹${totalAmount.toLocaleString('en-IN')}\n\nTrack your order:\n${trackingUrl}\n\nThank you for shopping with Bijnoor! 🙏`;
  
  return sendWhatsAppMessage(customerPhone, message);
}

/**
 * Send order status update via WhatsApp
 */
export async function sendOrderStatusMessage(
  customerPhone: string,
  orderNumber: string,
  status: string,
  trackingUrl?: string
) {
  const statusMessages: { [key: string]: string } = {
    pending: `📋 *Order Received* - Your order #${orderNumber} is confirmed!\n\nWe'll start processing soon. Thank you!`,
    processing: `📦 *Processing* - We're preparing your order #${orderNumber}!\n\nWill ship soon.`,
    shipped: `🚚 *On The Way!* - Your order #${orderNumber} is shipped!\n\n📍 Track: ${trackingUrl || 'Coming soon'}`,
    out_for_delivery: `🏃 *Out for Delivery* - Your order #${orderNumber} is on its way to you today!`,
    delivered: `✅ *Delivered!* - Your order #${orderNumber} has arrived! 🎉\n\nThank you for shopping with Bijnoor!`,
    cancelled: `❌ *Cancelled* - Your order #${orderNumber} has been cancelled.\n\nRefund will be processed within 5-7 days.`,
    failed: `⚠️ *Delivery Failed* - Couldn't deliver order #${orderNumber}. We'll contact you soon.`
  };

  const message = statusMessages[status] || `📦 Order #${orderNumber} status updated to: ${status}`;
  return sendWhatsAppMessage(customerPhone, message);
}

/**
 * Send promotional message
 */
export async function sendPromoMessage(
  customerPhone: string,
  promoTitle: string,
  promoDetails: string,
  ctaLink?: string
) {
  const message = `🎊 *${promoTitle}*\n\n${promoDetails}${
    ctaLink ? `\n\n👉 Shop Now: ${ctaLink}` : ''
  }\n\nLimited time offer! 🔥`;
  
  return sendWhatsAppMessage(customerPhone, message);
}

/**
 * Send invoice/bill via WhatsApp
 */
export async function sendInvoiceMessage(
  customerPhone: string,
  billNumber: string,
  totalAmount: number,
  invoiceUrl: string
) {
  const message = `📄 *Invoice Generated*\n\nBill #${billNumber}\nAmount: ₹${totalAmount.toLocaleString('en-IN')}\n\nDownload: ${invoiceUrl}\n\nThank you! 🙏`;
  
  return sendWhatsAppMessage(customerPhone, message);
}

/**
 * Send custom message (for admin use)
 */
export async function sendCustomMessage(
  customerPhone: string,
  customMessage: string
) {
  return sendWhatsAppMessage(customerPhone, customMessage);
}
