const CASHFREE_API_VERSION = '2023-08-01';

export function getCashfreeMode() {
  return process.env.NEXT_PUBLIC_CASHFREE_MODE === 'production' ? 'production' : 'sandbox';
}

export function getCashfreeBaseUrl() {
  return getCashfreeMode() === 'production'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg';
}

export function getCashfreeSiteUrl() {
  return String(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
}

function getCashfreeCredentials() {
  const appId = process.env.CASHFREE_APP_ID;
  const secretKey = process.env.CASHFREE_SECRET_KEY;

  if (!appId || !secretKey) {
    throw new Error('CASHFREE_APP_ID and CASHFREE_SECRET_KEY must be set');
  }

  return { appId, secretKey };
}

function buildHeaders() {
  const { appId, secretKey } = getCashfreeCredentials();

  return {
    'Content-Type': 'application/json',
    'x-client-id': appId,
    'x-client-secret': secretKey,
    'x-api-version': CASHFREE_API_VERSION,
  };
}

export async function createCashfreeOrder(payload: {
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  returnUrl: string;
}) {
  const response = await fetch(`${getCashfreeBaseUrl()}/orders`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({
      order_id: payload.orderId,
      order_amount: payload.amount,
      order_currency: 'INR',
      customer_details: {
        customer_id: payload.customerEmail.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        customer_name: payload.customerName,
        customer_email: payload.customerEmail,
        customer_phone: payload.customerPhone,
      },
      order_meta: {
        return_url: payload.returnUrl,
      },
      order_note: 'BijNoor checkout',
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || data.error || 'Failed to create Cashfree order');
  }

  return data as {
    order_id: string;
    order_status?: string;
    payment_session_id?: string;
  };
}

export async function getCashfreeOrderStatus(orderId: string) {
  const response = await fetch(`${getCashfreeBaseUrl()}/orders/${encodeURIComponent(orderId)}`, {
    method: 'GET',
    headers: buildHeaders(),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || data.error || 'Failed to fetch Cashfree order status');
  }

  return data as {
    order_id: string;
    order_status?: string;
    payment_session_id?: string;
    order_amount?: number;
    order_currency?: string;
  };
}