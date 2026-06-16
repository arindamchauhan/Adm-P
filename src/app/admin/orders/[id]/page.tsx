"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { getAdminBasePath } from '@/lib/admin-path';

type OrderDetails = {
  _id: string;
  orderId: string;
  source?: string;
  isQuickOrder?: boolean;
  createdAt?: string;
  updatedAt?: string;
  status?: string;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
    whatsapp?: string;
    address?: string;
    city?: string;
    district?: string;
    state?: string;
    pincode?: string;
  };
  items?: {
    productName?: string;
    quantity?: number;
    price?: number;
    total?: number;
  }[];
  summary?: {
    subtotal?: number;
    shipping?: number;
    total?: number;
  };
  payment?: {
    method?: string;
    status?: string;
    transactionId?: string;
  };
  delivery?: {
    isServiceable?: boolean;
    estimatedDeliveryDate?: string;
    estimatedDays?: number;
  };
};

const STATUS_OPTIONS = [
  "pending",
  "confirmed",
  "processing",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "returned",
];

function formatStatusLabel(status?: string) {
  if (!status) return "pending";
  return status.replaceAll("_", " ");
}

function formatINR(value?: number) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function normalizeWhatsappNumber(input?: string) {
  const digits = String(input || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("91") && digits.length === 12) return digits;
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

export default function AdminOrderDetailsPage() {
  const params = useParams<{ id: string }>();
  const pathname = usePathname();
  const adminBasePath = getAdminBasePath(pathname);
  const orderId = String(params?.id || "");

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [status, setStatus] = useState("pending");
  const [adminNote, setAdminNote] = useState("Status updated by admin");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const tokenHeader = (): Record<string, string> => {
    const token = localStorage.getItem("authToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchOrder = async () => {
    setError("");
    setSuccess("");
    setIsLoading(true);
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        headers: tokenHeader(),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to load order details");
      }

      const normalizedOrder: OrderDetails = data.order;
      // Backfill whatsapp from phone for standard orders.
      if (normalizedOrder.customer && !normalizedOrder.customer.whatsapp) {
        normalizedOrder.customer.whatsapp = normalizedOrder.customer.phone;
      }

      setOrder(normalizedOrder);
      setStatus(String(normalizedOrder.status || "pending"));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load order details");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!orderId) return;
    fetchOrder();
  }, [orderId]);

  const updateStatus = async () => {
    if (!order?.orderId) return;

    setError("");
    setSuccess("");
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/orders/${order.orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...tokenHeader(),
        },
        body: JSON.stringify({ status, notes: adminNote }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update order status");
      }

      setOrder((prev) => (prev ? { ...prev, status: data.order?.status || status } : prev));
      setSuccess("Order status updated successfully.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update order status");
    } finally {
      setIsUpdating(false);
    }
  };

  const whatsappLink = useMemo(() => {
    const customer = order?.customer;
    const number = normalizeWhatsappNumber(customer?.whatsapp || customer?.phone);
    if (!number || !order) return "";

    const message = [
      `Hello ${customer?.name || "Customer"},`,
      "",
      `Your BijNoor order ${order.orderId} update:`,
      `Order status: ${formatStatusLabel(status)}`,
      `Payment status: ${String(order.payment?.status || "pending")}`,
      `Payment type: ${String(order.payment?.method || "N/A")}`,
      `Delivery status: ${formatStatusLabel(status)}`,
      "",
      "Thank you for shopping with BijNoor.",
    ].join("\n");

    return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  }, [order, status]);

  if (isLoading) {
    return <p className="text-sm text-light-text">Loading order details...</p>;
  }

  if (error && !order) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-red-600">{error}</p>
        <Link href={`${adminBasePath}/orders`} className="text-gold font-semibold hover:underline">
          Back to Orders
        </Link>
      </div>
    );
  }

  if (!order) {
    return <p className="text-sm text-red-600">Order not found.</p>;
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-light-text">Order Details</p>
          <h1 className="text-3xl font-heading text-dark-text">{order.orderId}</h1>
          <p className="text-sm text-light-text mt-1">
            Source: {order.source || "web"} {order.isQuickOrder ? "- Quick order" : ""}
          </p>
        </div>
        <Link href={`${adminBasePath}/orders`} className="rounded-lg border border-beige px-4 py-2 text-sm font-semibold text-dark-text hover:bg-cream">
          Back to Orders
        </Link>
      </div>

      {success ? <p className="text-sm text-brand-green">{success}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-beige bg-white p-6 shadow-sm space-y-3">
          <h2 className="text-xl font-heading text-dark-text">Customer Info</h2>
          <p className="text-sm text-light-text"><span className="font-semibold text-dark-text">Name:</span> {order.customer?.name || "N/A"}</p>
          <p className="text-sm text-light-text"><span className="font-semibold text-dark-text">Email:</span> {order.customer?.email || "N/A"}</p>
          <p className="text-sm text-light-text"><span className="font-semibold text-dark-text">Phone:</span> {order.customer?.phone || "N/A"}</p>
          <p className="text-sm text-light-text"><span className="font-semibold text-dark-text">WhatsApp:</span> {order.customer?.whatsapp || order.customer?.phone || "N/A"}</p>
          <p className="text-sm text-light-text">
            <span className="font-semibold text-dark-text">Address:</span> {order.customer?.address || "N/A"}
            {order.customer?.district ? `, ${order.customer.district}` : ""}
            {order.customer?.city ? `, ${order.customer.city}` : ""}
            {order.customer?.state ? `, ${order.customer.state}` : ""}
            {order.customer?.pincode ? ` - ${order.customer.pincode}` : ""}
          </p>
        </article>

        <article className="rounded-2xl border border-beige bg-white p-6 shadow-sm space-y-3">
          <h2 className="text-xl font-heading text-dark-text">Order & Payment</h2>
          <p className="text-sm text-light-text"><span className="font-semibold text-dark-text">Order ID:</span> {order.orderId}</p>
          <p className="text-sm text-light-text"><span className="font-semibold text-dark-text">Order Status:</span> {formatStatusLabel(order.status)}</p>
          <p className="text-sm text-light-text"><span className="font-semibold text-dark-text">Payment Status:</span> {order.payment?.status || "pending"}</p>
          <p className="text-sm text-light-text"><span className="font-semibold text-dark-text">Payment Type:</span> {order.payment?.method || "N/A"}</p>
          <p className="text-sm text-light-text"><span className="font-semibold text-dark-text">Delivery Status:</span> {formatStatusLabel(order.status)}</p>
          <p className="text-sm text-light-text"><span className="font-semibold text-dark-text">Created:</span> {order.createdAt ? new Date(order.createdAt).toLocaleString("en-IN") : "N/A"}</p>
        </article>
      </div>

      <article className="rounded-2xl border border-beige bg-white p-6 shadow-sm">
        <h2 className="text-xl font-heading text-dark-text">Items</h2>
        <div className="mt-3 space-y-2">
          {(order.items || []).map((item, index) => (
            <div key={`${item.productName || "item"}-${index}`} className="flex items-center justify-between rounded-lg border border-beige bg-cream px-3 py-2 text-sm">
              <div>
                <p className="font-semibold text-dark-text">{item.productName || "Product"}</p>
                <p className="text-light-text">Qty: {item.quantity || 1}</p>
              </div>
              <p className="font-semibold text-dark-text">{formatINR(item.total || (item.price || 0) * (item.quantity || 1))}</p>
            </div>
          ))}
          {!order.items?.length ? <p className="text-sm text-light-text">No items found.</p> : null}
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3 text-sm">
          <p className="text-light-text"><span className="font-semibold text-dark-text">Subtotal:</span> {formatINR(order.summary?.subtotal)}</p>
          <p className="text-light-text"><span className="font-semibold text-dark-text">Shipping:</span> {formatINR(order.summary?.shipping)}</p>
          <p className="text-light-text"><span className="font-semibold text-dark-text">Total:</span> {formatINR(order.summary?.total)}</p>
        </div>
      </article>

      <article className="rounded-2xl border border-beige bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-xl font-heading text-dark-text">Admin Actions</h2>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-light-text mb-1">Update Status</label>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="w-full rounded-lg border border-beige bg-cream px-3 py-2 text-dark-text outline-none focus:border-gold"
            >
              {STATUS_OPTIONS.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-light-text mb-1">Admin Note</label>
            <input
              value={adminNote}
              onChange={(event) => setAdminNote(event.target.value)}
              className="w-full rounded-lg border border-beige bg-cream px-3 py-2 text-dark-text outline-none focus:border-gold"
              placeholder="Status updated by admin"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={updateStatus}
            disabled={isUpdating}
            className="rounded-lg bg-gold px-5 py-2.5 font-semibold text-white hover:brightness-95 disabled:opacity-60"
          >
            {isUpdating ? "Updating..." : "Update Order Status"}
          </button>

          <a
            href={whatsappLink || "#"}
            target="_blank"
            rel="noreferrer"
            className={`rounded-lg px-5 py-2.5 font-semibold text-white ${whatsappLink ? "bg-[#25D366] hover:brightness-95" : "bg-gray-300 pointer-events-none"}`}
          >
            Send WhatsApp Update
          </a>
        </div>

        <p className="text-xs text-light-text">
          WhatsApp button opens chat with a pre-filled confirmation/status message so your business account can send it in one click.
        </p>
      </article>
    </section>
  );
}
