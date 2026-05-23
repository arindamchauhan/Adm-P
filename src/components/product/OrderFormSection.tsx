"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import OTPVerification from "@/components/OTPVerification";

type FormState = {
  fullName: string;
  phoneNumber: string;
  emailAddress: string;
  houseAddress: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  quantity: number;
  paymentMethod: "cod" | "upi" | "card";
};

type PaymentOption = {
  value: FormState["paymentMethod"];
  label: string;
  description: string;
  badge: string;
  available: boolean;
};

type DeliveryState = {
  isServiceable: boolean;
  etaLabel: string;
  estimatedDays: number;
  estimatedDeliveryDate: string;
};

type PublicSiteSettings = {
  supportEmail: string;
  supportPhone: string;
  supportWhatsapp: string;
  contactEmail: string;
};

const initialState: FormState = {
  fullName: "",
  phoneNumber: "",
  emailAddress: "",
  houseAddress: "",
  city: "",
  district: "",
  state: "",
  pincode: "",
  quantity: 1,
  paymentMethod: "upi",
};

const DEFAULT_UNIT_PRICE = 399;
const DEFAULT_PRODUCT_NAME = "BijNoor Natural Hair Mask";
const FORM_STORAGE_KEY = "bijnoor-quick-order";
const EXIT_INTENT_SHOWN_KEY = "bijnoor-exit-intent-shown";

const defaultSupportSettings: PublicSiteSettings = {
  supportEmail: "support@bijnoor.com",
  supportPhone: "+919876543210",
  supportWhatsapp: "919999999999",
  contactEmail: "info@bijnoor.com",
};

interface OrderFormSectionProps {
  initialQuantity?: number;
  initialProductName?: string;
  initialUnitPrice?: number;
  quantitySyncKey?: number;
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    value: "cod",
    label: "Cash on Delivery",
    description: "Temporarily unavailable",
    badge: "Unavailable",
    available: false,
  },
  {
    value: "upi",
    label: "UPI",
    description: "Instant mobile payment",
    badge: "Fast",
    available: true,
  },
  {
    value: "card",
    label: "Card",
    description: "Temporarily unavailable",
    badge: "Unavailable",
    available: false,
  },
];

function getFieldErrors(form: FormState) {
  const errors: Record<string, string> = {};
  if (!form.fullName.trim()) errors.fullName = "Full name is required.";
  if (!/^\d{10}$/.test(form.phoneNumber.trim())) errors.phoneNumber = "Enter a valid 10-digit phone number.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.emailAddress.trim())) errors.emailAddress = "Enter a valid email address.";
  if (!form.houseAddress.trim()) errors.houseAddress = "House address is required.";
  if (!form.city.trim()) errors.city = "City is required.";
  if (!form.district.trim()) errors.district = "District is required.";
  if (!form.state.trim()) errors.state = "State is required.";
  if (!/^\d{6}$/.test(form.pincode.trim())) errors.pincode = "Enter a valid 6-digit pincode.";
  if (!Number.isInteger(form.quantity) || form.quantity < 1 || form.quantity > 5) {
    errors.quantity = "Quantity must be between 1 and 5.";
  }
  return errors;
}

export default function OrderFormSection({
  initialQuantity = 1,
  initialProductName = DEFAULT_PRODUCT_NAME,
  initialUnitPrice = DEFAULT_UNIT_PRICE,
  quantitySyncKey = 0,
}: OrderFormSectionProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialState);
  const [selectedProductName, setSelectedProductName] = useState(initialProductName);
  const [selectedUnitPrice, setSelectedUnitPrice] = useState(initialUnitPrice);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [otpToken, setOtpToken] = useState("");
  const [deliveryState, setDeliveryState] = useState<DeliveryState | null>(null);
  const [isCheckingPincode, setIsCheckingPincode] = useState(false);
  const [showExitPrompt, setShowExitPrompt] = useState(false);
  const [hasSessionInteraction, setHasSessionInteraction] = useState(false);
  const [abandonmentSaved, setAbandonmentSaved] = useState(false);
  const [supportSettings, setSupportSettings] = useState<PublicSiteSettings>(defaultSupportSettings);
  const mountedAtRef = useRef(Date.now());

  const summary = useMemo(() => {
    const subtotal = selectedUnitPrice * form.quantity;
    const shipping = 0;
    const total = subtotal + shipping;
    return { subtotal, shipping, total };
  }, [form.quantity, selectedUnitPrice]);

  const fieldErrors = useMemo(() => getFieldErrors(form), [form]);
  const isFormValid = Object.keys(fieldErrors).length === 0;
  const isOtpVerified = Boolean(otpToken);
  const isContactStepValid = !fieldErrors.fullName && !fieldErrors.phoneNumber && !fieldErrors.emailAddress && isOtpVerified;
  const isAddressStepValid = !fieldErrors.houseAddress && !fieldErrors.city && !fieldErrors.district && !fieldErrors.state && !fieldErrors.pincode && Boolean(deliveryState?.isServiceable);
  const hasDraftData = Boolean(form.fullName || form.phoneNumber || form.emailAddress || form.houseAddress || form.city || form.district || form.state || form.pincode);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FORM_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<FormState>;
      setForm((prev) => ({ ...prev, ...parsed }));
    } catch {
      // Ignore malformed local storage payload.
    }
  }, []);

  useEffect(() => {
    const loadSupportSettings = async () => {
      try {
        const res = await fetch("/api/site-settings");
        const data = await res.json();
        if (!res.ok || !data.settings) return;

        setSupportSettings({
          supportEmail: String(data.settings.supportEmail || defaultSupportSettings.supportEmail),
          supportPhone: String(data.settings.supportPhone || defaultSupportSettings.supportPhone),
          supportWhatsapp: String(data.settings.supportWhatsapp || defaultSupportSettings.supportWhatsapp),
          contactEmail: String(data.settings.contactEmail || defaultSupportSettings.contactEmail),
        });
      } catch {
        // Keep fallback support settings.
      }
    };

    loadSupportSettings();
  }, []);

  useEffect(() => {
    if (!hasDraftData) return;
    localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(form));
  }, [form, hasDraftData]);

  useEffect(() => {
    const safeUnitPrice = Math.max(1, initialUnitPrice);
    const safeProductName = initialProductName.trim() || DEFAULT_PRODUCT_NAME;
    setSelectedUnitPrice(safeUnitPrice);
    setSelectedProductName(safeProductName);
  }, [initialProductName, initialUnitPrice]);

  useEffect(() => {
    const safeQuantity = Math.min(5, Math.max(1, initialQuantity));
    setForm((prev) => ({ ...prev, quantity: safeQuantity }));
    setStep(1);
  }, [quantitySyncKey, initialQuantity]);

  useEffect(() => {
    if (form.pincode.length !== 6) {
      setDeliveryState(null);
      return;
    }

    const firstDigit = Number(form.pincode[0]);
    const isServiceable = Number.isFinite(firstDigit) && firstDigit !== 0;
    const estimatedDays = [1, 4, 5, 6, 7].includes(firstDigit) ? 3 : 5;
    const etaDate = new Date();
    etaDate.setDate(etaDate.getDate() + estimatedDays);

    setDeliveryState({
      isServiceable,
      etaLabel: isServiceable ? `Estimated delivery in ${estimatedDays} days` : "Currently not serviceable for this pincode",
      estimatedDays,
      estimatedDeliveryDate: etaDate.toISOString(),
    });
  }, [form.pincode]);

  useEffect(() => {
    function markInteraction() {
      setHasSessionInteraction(true);
    }

    window.addEventListener("pointerdown", markInteraction, { passive: true });
    window.addEventListener("keydown", markInteraction);
    window.addEventListener("touchstart", markInteraction, { passive: true });

    return () => {
      window.removeEventListener("pointerdown", markInteraction);
      window.removeEventListener("keydown", markInteraction);
      window.removeEventListener("touchstart", markInteraction);
    };
  }, []);

  useEffect(() => {
    const hasFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const isDesktopViewport = window.innerWidth >= 1024;
    const alreadyShown = sessionStorage.getItem(EXIT_INTENT_SHOWN_KEY) === "1";

    if (!hasFinePointer || !isDesktopViewport || alreadyShown) {
      return;
    }

    function onExitIntent(event: MouseEvent) {
      // Only react when the pointer actually leaves the document from the top edge.
      if (event.relatedTarget !== null) return;
      if (event.target !== document.documentElement) return;
      if (Date.now() - mountedAtRef.current < 1500) return;
      if (event.clientY > 0 || showExitPrompt || orderId || !hasDraftData || !hasSessionInteraction) return;

      sessionStorage.setItem(EXIT_INTENT_SHOWN_KEY, "1");
      setShowExitPrompt(true);
    }

    document.documentElement.addEventListener("mouseleave", onExitIntent);
    return () => document.documentElement.removeEventListener("mouseleave", onExitIntent);
  }, [showExitPrompt, orderId, hasDraftData, hasSessionInteraction]);

  useEffect(() => {
    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (!hasDraftData || orderId) return;
      event.preventDefault();
      event.returnValue = "";

      const payload = {
        fullName: form.fullName,
        phoneNumber: form.phoneNumber,
        emailAddress: form.emailAddress,
        pincode: form.pincode,
        preferredChannel: "email",
        intentSource: "before_unload",
        message: "Checkout abandoned before order completion",
      };

      const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
      navigator.sendBeacon("/api/abandonment", blob);
    }

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [form, hasDraftData, orderId]);

  async function autofillByPincode() {
    if (!/^\d{6}$/.test(form.pincode)) return;

    setIsCheckingPincode(true);
    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${form.pincode}`);
      const payload = (await response.json()) as Array<{ Status?: string; PostOffice?: Array<{ District?: string; State?: string; Block?: string }> }>;
      const first = payload?.[0];
      const office = first?.PostOffice?.[0];

      if (first?.Status === "Success" && office) {
        setForm((prev) => ({
          ...prev,
          district: prev.district || office.District || "",
          state: prev.state || office.State || "",
          city: prev.city || office.Block || office.District || "",
        }));
      }
    } catch {
      // Keep manual entry available when external API is unavailable.
    } finally {
      setIsCheckingPincode(false);
    }
  }

  async function saveAbandonment(channel: "whatsapp" | "email") {
    if (abandonmentSaved) return;

    await fetch("/api/abandonment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: form.fullName,
        phoneNumber: form.phoneNumber,
        emailAddress: form.emailAddress,
        pincode: form.pincode,
        preferredChannel: channel,
        intentSource: "exit_intent",
        message: "Customer triggered recovery prompt before checkout",
      }),
    }).catch(() => undefined);

    setAbandonmentSaved(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isFormValid || !isOtpVerified || !deliveryState?.isServiceable) {
      setError("Please complete verification and required details before placing your order.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setCopied(false);

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer: {
          fullName: form.fullName,
          phoneNumber: form.phoneNumber,
          emailAddress: form.emailAddress,
          houseAddress: form.houseAddress,
          city: form.city,
          district: form.district,
          state: form.state,
          pincode: form.pincode,
        },
        orderSummary: summary,
        payment: {
          method: form.paymentMethod,
          status: "pending",
        },
        otpVerificationToken: otpToken,
        product: {
          name: selectedProductName,
          quantity: form.quantity,
          unitPrice: selectedUnitPrice,
        },
        delivery: {
          isServiceable: deliveryState?.isServiceable,
          estimatedDays: deliveryState?.estimatedDays,
          estimatedDeliveryDate: deliveryState?.estimatedDeliveryDate,
        },
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const placedOrderId = String(data.orderId || "");

      setOrderId(placedOrderId);
      setForm(initialState);
      setOtpToken("");
      setDeliveryState(null);
      localStorage.removeItem(FORM_STORAGE_KEY);
      setIsSubmitting(false);

      setTimeout(() => {
        router.push(`/track-order?orderId=${encodeURIComponent(placedOrderId)}&email=${encodeURIComponent(form.emailAddress)}`);
      }, 1200);
      return;
    }

    const payload = await response.json().catch(() => ({}));
    setError(payload.error || "Failed to place order. Please try again.");
    setIsSubmitting(false);
  }

  return (
    <section id="order-form" className="relative bg-[#fffdf8] py-14 pb-28 sm:py-16 sm:pb-16">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <form onSubmit={handleSubmit} className="rounded-2xl border border-[#e6dfd3] bg-white p-5 shadow-sm sm:p-6">
            <h2 className="font-heading text-3xl text-[#1f2f20]">Order Now</h2>
            <p className="mt-2 text-sm text-[#536957]">Contact first, then address, then payment for faster checkout.</p>

            <div className="mt-5 grid grid-cols-3 gap-2 rounded-xl bg-[#f5f9f6] p-2 text-xs sm:text-sm">
              {[1, 2, 3].map((index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setStep(index)}
                  className={`rounded-lg px-3 py-2 font-semibold ${step === index ? "bg-[#1f6f3d] text-white" : step > index ? "bg-[#d8eadc] text-[#1f6f3d]" : "bg-white text-[#55725b]"}`}
                >
                  {index === 1 ? "Contact" : index === 2 ? "Address" : "Payment"}
                </button>
              ))}
            </div>

            {step === 1 ? (
              <div className="mt-5 space-y-5">
                <div className="rounded-2xl border border-[#dce5de] bg-gradient-to-br from-[#f7fbf8] via-[#fbfdfc] to-white p-4 shadow-[0_8px_24px_rgba(31,111,61,0.08)] sm:p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5f7866]">Step 1</p>
                  <h3 className="mt-1 font-heading text-xl text-[#1f2f20]">Contact Details</h3>
                  <p className="mt-1 text-sm text-[#5a7260]">Use a reachable phone number for OTP verification.</p>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <input required placeholder="Full Name" value={form.fullName} onChange={(e) => setForm((s) => ({ ...s, fullName: e.target.value }))} autoComplete="name" className="rounded-xl border border-[#d2dfd5] bg-white px-4 py-3 text-sm text-[#26362a] shadow-sm focus:border-[#2f8a53] focus:outline-none focus:ring-2 focus:ring-[#2f8a53]/20" />
                    <input required placeholder="Phone Number" value={form.phoneNumber} inputMode="numeric" autoComplete="tel" maxLength={10} onChange={(e) => { setForm((s) => ({ ...s, phoneNumber: e.target.value.replace(/\D/g, "") })); setOtpToken(""); }} className="rounded-xl border border-[#d2dfd5] bg-white px-4 py-3 text-sm text-[#26362a] shadow-sm focus:border-[#2f8a53] focus:outline-none focus:ring-2 focus:ring-[#2f8a53]/20" />
                    {fieldErrors.fullName ? <p className="-mt-1 text-xs text-[#b3261e]">{fieldErrors.fullName}</p> : <div />}
                    {fieldErrors.phoneNumber ? <p className="-mt-1 text-xs text-[#b3261e]">{fieldErrors.phoneNumber}</p> : <div />}
                    <input required type="email" placeholder="Email Address" value={form.emailAddress} onChange={(e) => setForm((s) => ({ ...s, emailAddress: e.target.value }))} autoComplete="email" className="rounded-xl border border-[#d2dfd5] bg-white px-4 py-3 text-sm text-[#26362a] shadow-sm focus:border-[#2f8a53] focus:outline-none focus:ring-2 focus:ring-[#2f8a53]/20 sm:col-span-2" />
                    {fieldErrors.emailAddress ? <p className="-mt-1 text-xs text-[#b3261e] sm:col-span-2">{fieldErrors.emailAddress}</p> : null}
                  </div>
                </div>

                <div className="rounded-2xl border border-[#d7e4da] bg-white p-4 shadow-[0_8px_18px_rgba(31,111,61,0.07)] sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-heading text-lg text-[#223528]">OTP Phone Verification</p>
                    <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${isOtpVerified ? "bg-[#e7f6ec] text-[#1f6f3d]" : "bg-[#f3f6f4] text-[#607667]"}`}>{isOtpVerified ? "Verified" : "Required"}</span>
                  </div>
                  <div className="mt-4">
                    <OTPVerification
                      phoneNumber={form.phoneNumber}
                      onVerificationSuccess={(verificationToken) => {
                        setOtpToken(verificationToken);
                        setError("");
                      }}
                      onVerificationFailed={(message) => {
                        setOtpToken("");
                        setError(message);
                      }}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button type="button" disabled={!isContactStepValid} onClick={() => setStep(2)} className="rounded-xl bg-gradient-to-r from-[#1f6f3d] to-[#2f8a53] px-6 py-3 text-sm font-bold tracking-[0.02em] text-white shadow-[0_10px_24px_rgba(31,111,61,0.2)] disabled:opacity-60">Continue to Address</button>
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="mt-5 space-y-5">
                <div className="rounded-2xl border border-[#dce5de] bg-gradient-to-br from-[#f7fbf8] via-[#fbfdfc] to-white p-4 shadow-[0_8px_24px_rgba(31,111,61,0.08)] sm:p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5f7866]">Step 2</p>
                  <h3 className="mt-1 font-heading text-xl text-[#1f2f20]">Shipping Address</h3>
                  <p className="mt-1 text-sm text-[#5a7260]">Enter delivery details and verify pincode serviceability.</p>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <input required placeholder="House Address" value={form.houseAddress} onChange={(e) => setForm((s) => ({ ...s, houseAddress: e.target.value }))} autoComplete="street-address" className="rounded-xl border border-[#d2dfd5] bg-white px-4 py-3 text-sm text-[#26362a] shadow-sm focus:border-[#2f8a53] focus:outline-none focus:ring-2 focus:ring-[#2f8a53]/20 sm:col-span-2" />
                    {fieldErrors.houseAddress ? <p className="-mt-1 text-xs text-[#b3261e] sm:col-span-2">{fieldErrors.houseAddress}</p> : null}
                    <input required placeholder="Pincode" value={form.pincode} inputMode="numeric" autoComplete="postal-code" maxLength={6} onChange={(e) => setForm((s) => ({ ...s, pincode: e.target.value.replace(/\D/g, "") }))} className="rounded-xl border border-[#d2dfd5] bg-white px-4 py-3 text-sm text-[#26362a] shadow-sm focus:border-[#2f8a53] focus:outline-none focus:ring-2 focus:ring-[#2f8a53]/20" />
                    <button type="button" onClick={autofillByPincode} disabled={isCheckingPincode || form.pincode.length !== 6} className="rounded-xl border border-[#1f6f3d]/25 bg-white px-4 py-3 text-sm font-semibold text-[#1f6f3d] hover:bg-[#f4faf6] disabled:opacity-60">{isCheckingPincode ? "Checking..." : "Auto-fill City/State"}</button>
                    {fieldErrors.pincode ? <p className="-mt-1 text-xs text-[#b3261e] sm:col-span-2">{fieldErrors.pincode}</p> : null}
                    <input required placeholder="City" value={form.city} onChange={(e) => setForm((s) => ({ ...s, city: e.target.value }))} autoComplete="address-level2" className="rounded-xl border border-[#d2dfd5] bg-white px-4 py-3 text-sm text-[#26362a] shadow-sm focus:border-[#2f8a53] focus:outline-none focus:ring-2 focus:ring-[#2f8a53]/20" />
                    <input required placeholder="District" value={form.district} onChange={(e) => setForm((s) => ({ ...s, district: e.target.value }))} className="rounded-xl border border-[#d2dfd5] bg-white px-4 py-3 text-sm text-[#26362a] shadow-sm focus:border-[#2f8a53] focus:outline-none focus:ring-2 focus:ring-[#2f8a53]/20" />
                    <input required placeholder="State" value={form.state} onChange={(e) => setForm((s) => ({ ...s, state: e.target.value }))} autoComplete="address-level1" className="rounded-xl border border-[#d2dfd5] bg-white px-4 py-3 text-sm text-[#26362a] shadow-sm focus:border-[#2f8a53] focus:outline-none focus:ring-2 focus:ring-[#2f8a53]/20 sm:col-span-2" />
                  </div>
                </div>

                {deliveryState ? <div className={`rounded-xl px-4 py-3 text-sm font-medium ${deliveryState.isServiceable ? "border border-[#d3e7d8] bg-[#edf8f0] text-[#245334]" : "border border-[#f5d8d4] bg-[#fff1ef] text-[#9b2f26]"}`}>{deliveryState.etaLabel}</div> : null}

                <div className="flex items-center justify-between">
                  <button type="button" onClick={() => setStep(1)} className="rounded-xl border border-[#cedfd2] bg-white px-5 py-2.5 text-sm font-semibold text-[#3f5b46] hover:bg-[#f7fbf8]">Back</button>
                  <button type="button" disabled={!isAddressStepValid} onClick={() => setStep(3)} className="rounded-xl bg-gradient-to-r from-[#1f6f3d] to-[#2f8a53] px-6 py-3 text-sm font-bold tracking-[0.02em] text-white shadow-[0_10px_24px_rgba(31,111,61,0.2)] disabled:opacity-60">Continue to Payment</button>
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="mt-5 space-y-5">
                <div className="rounded-2xl border border-[#dce5de] bg-gradient-to-br from-[#f7fbf8] via-[#fbfdfc] to-white p-4 shadow-[0_8px_24px_rgba(31,111,61,0.08)] sm:p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5f7866]">Order Units</p>
                      <label className="mt-1 block font-heading text-xl text-[#1f2f20]">Quantity</label>
                    </div>
                    <p className="text-sm font-semibold text-[#3f5f49]">Max 5 per order</p>
                  </div>

                  <div className="mt-4 inline-flex items-center gap-3 rounded-2xl border border-[#d0dfd3] bg-white/95 px-3 py-2 shadow-inner">
                    <button
                      type="button"
                      onClick={() => setForm((s) => ({ ...s, quantity: Math.max(1, s.quantity - 1) }))}
                      className="h-11 w-11 rounded-xl border border-[#cadecf] bg-[#f7fbf8] text-lg font-extrabold text-[#1f6f3d] hover:bg-[#ecf7f0]"
                      aria-label="Decrease quantity"
                    >
                      -
                    </button>
                    <span className="min-w-14 text-center font-heading text-2xl font-semibold text-[#223528]">{form.quantity}</span>
                    <button
                      type="button"
                      onClick={() => setForm((s) => ({ ...s, quantity: Math.min(5, s.quantity + 1) }))}
                      className="h-11 w-11 rounded-xl border border-[#cadecf] bg-[#f7fbf8] text-lg font-extrabold text-[#1f6f3d] hover:bg-[#ecf7f0]"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>

                <fieldset className="rounded-2xl border border-[#dae6dc] bg-white p-4 sm:p-5">
                  <legend className="px-1 text-sm font-semibold uppercase tracking-[0.1em] text-[#4a6654]">Payment Information</legend>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {PAYMENT_OPTIONS.map((option) => (
                      <label key={option.value} className="cursor-pointer">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={option.value}
                          checked={form.paymentMethod === option.value}
                          onChange={() => setForm((s) => ({ ...s, paymentMethod: option.value }))}
                          disabled={!option.available}
                          className="peer sr-only"
                        />
                        <div className={`rounded-2xl border p-4 transition-all duration-200 ${option.available ? "border-[#d6e3d9] bg-gradient-to-br from-[#f7fbf8] to-white peer-checked:border-[#1f6f3d] peer-checked:shadow-[0_10px_24px_rgba(31,111,61,0.16)]" : "border-[#e3e6e4] bg-[#f5f6f5] opacity-70"}`}>
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-heading text-lg leading-none text-[#1f2f20]">{option.label}</p>
                            <span className="rounded-full border border-[#c9dbcf] bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#3c6248]">{option.badge}</span>
                          </div>
                          <p className="mt-2 text-xs text-[#5d7565]">{option.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-[#5d7565]">COD and Card payments are temporarily unavailable. Please use UPI for now.</p>
                </fieldset>

                <div className="flex items-center justify-between pt-1">
                  <button type="button" onClick={() => setStep(2)} className="rounded-xl border border-[#cedfd2] bg-white px-5 py-2.5 text-sm font-semibold text-[#3f5b46] hover:bg-[#f7fbf8]">Back</button>
                  <button type="submit" disabled={isSubmitting || !isFormValid || !isOtpVerified || !deliveryState?.isServiceable} className="rounded-xl bg-gradient-to-r from-[#1f6f3d] to-[#2f8a53] px-6 py-3 text-sm font-bold tracking-[0.02em] text-white shadow-[0_10px_24px_rgba(31,111,61,0.2)] disabled:opacity-60">{isSubmitting ? "Placing Order..." : "Place Order"}</button>
                </div>
              </div>
            ) : null}

            {orderId ? (
              <div className="mt-3 rounded-lg bg-[#edf8f0] px-3 py-3 text-sm font-medium text-[#1f6f3d]">
                <p>Your order has been placed. Order ID: {orderId}</p>
                <button type="button" onClick={async () => { await navigator.clipboard.writeText(orderId); setCopied(true); }} className="mt-2 rounded-md bg-white px-3 py-1 text-xs font-semibold text-[#1f6f3d]">
                  {copied ? "Order ID Copied" : "Copy Order ID"}
                </button>
              </div>
            ) : null}
            {error ? <p className="mt-3 text-sm text-[#b3261e]">{error}</p> : null}
          </form>

          <aside className="rounded-2xl border border-[#e6dfd3] bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-24 lg:h-fit">
            <h3 className="text-xl font-semibold text-[#223126]">Order Summary</h3>
            <div className="mt-4 space-y-2 text-sm text-[#445a48]">
              <div className="flex justify-between">
                <span>{selectedProductName} x {form.quantity}</span>
                <span>₹{summary.subtotal}</span>
              </div>
              <div className="flex justify-between"><span>Shipping</span><span>Free</span></div>
              <div className="my-2 border-t border-dashed border-[#dce7df]" />
              <div className="flex justify-between text-base font-bold text-[#1f2f20]"><span>Total</span><span>₹{summary.total}</span></div>
            </div>

            <div className="mt-6 rounded-xl bg-[#f8fbf9] p-4 text-sm text-[#4d6351]">
              <p className="font-semibold text-[#2a3c2e]">Payment Information</p>
              <p className="mt-2">Your selected payment method will be confirmed at checkout. Order status starts as pending and is updated after confirmation.</p>
            </div>

            <ul className="mt-5 space-y-2 text-xs text-[#4f6552]">
              <li>Fast checkout with guided steps</li>
              <li>Pincode-based serviceability and ETA</li>
              <li>OTP verification protects against fake orders</li>
            </ul>

            <button type="button" onClick={() => { localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(form)); }} className="mt-4 w-full rounded-lg border border-[#d5e2d7] bg-white px-3 py-2 text-xs font-semibold text-[#2e4c36]">
              Save Details for Fast Checkout
            </button>
          </aside>
        </div>
      </div>

      {showExitPrompt ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-[#1f2f20]">Before you leave</h3>
            <p className="mt-2 text-sm text-[#516a56]">Want us to help you complete your order later via WhatsApp or email?</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a href={`https://wa.me/${supportSettings.supportWhatsapp}?text=${encodeURIComponent("Hi, I need help completing my BijNoor order.")}`} target="_blank" rel="noreferrer" onClick={() => saveAbandonment("whatsapp")} className="rounded-lg bg-[#1f6f3d] px-4 py-2 text-sm font-semibold text-white">Continue on WhatsApp</a>
              <a href={`mailto:${supportSettings.contactEmail}?subject=${encodeURIComponent("Need help with BijNoor order")}&body=${encodeURIComponent("Please help me complete my order.")}`} onClick={() => saveAbandonment("email")} className="rounded-lg border border-[#1f6f3d]/25 bg-white px-4 py-2 text-sm font-semibold text-[#1f6f3d]">Continue via Email</a>
            </div>
            <button type="button" onClick={() => setShowExitPrompt(false)} className="mt-3 text-xs font-semibold text-[#607865]">No thanks, continue checkout</button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
