"use client";

import { motion } from "framer-motion";
import { ShoppingBag, Wallet } from "lucide-react";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type StickyMobileButtonProps = {
  mode?: "shop" | "cart";
};

export default function StickyMobileButton({ mode = "shop" }: StickyMobileButtonProps) {
  const router = useRouter();
  const { getTotalItems, getTotalPrice } = useCart();
  const itemCount = getTotalItems();
  const total = Math.round(getTotalPrice() * 1.1);
  const isEmptyCart = itemCount === 0;
  const startingPrice = 399;
  const [isRoutingCheckout, setIsRoutingCheckout] = useState(false);

  const handleProceedCheckout = () => {
    setIsRoutingCheckout(true);
    router.push("/checkout");
  };

  if (mode === "cart" && isEmptyCart) {
    return null;
  }

  return (
    <>
      {/* Mobile sticky checkout bar */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-beige shadow-2xl px-4 pt-3"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-center justify-between rounded-xl bg-cream px-3 py-2 border border-beige mb-3">
          <p className="text-xs font-semibold text-light-text uppercase tracking-wide">
            {isEmptyCart && mode === "shop" ? "Your Cart Is Empty" : `Cart Total (${itemCount})`}
          </p>
          <p className="font-heading text-xl text-gold">
            {isEmptyCart && mode === "shop"
              ? `From ₹${startingPrice.toLocaleString()}`
              : `₹${total.toLocaleString()}`}
          </p>
        </div>

        {mode === "cart" ? (
          <button
            type="button"
            onClick={handleProceedCheckout}
            disabled={isRoutingCheckout}
            className="w-full py-3 bg-gold text-white font-bold rounded-xl flex items-center justify-center gap-2 active:brightness-90 active:scale-95 transition-all duration-200 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <Wallet size={18} />
            {isRoutingCheckout ? "Opening Checkout..." : "Proceed to Checkout"}
          </button>
        ) : isEmptyCart ? (
          <div className="space-y-2">
            <p className="text-xs text-light-text text-center">
              Start your natural haircare routine with our bestselling formula.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/products"
                className="py-3 border-2 border-gold text-gold font-semibold rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all duration-200 text-sm"
              >
                <ShoppingBag size={18} />
                Explore Range
              </Link>
              <Link
                href="/"
                className="py-3 bg-gold text-white font-bold rounded-xl flex items-center justify-center gap-2 active:brightness-90 active:scale-95 transition-all duration-200 text-sm"
              >
                <Wallet size={18} />
                Shop Best Seller
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/cart"
              className="py-3 border-2 border-gold text-gold font-semibold rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all duration-200 text-sm"
            >
              <ShoppingBag size={18} />
              Checkout
            </Link>
            <Link
              href="/checkout"
              className="py-3 bg-gold text-white font-bold rounded-xl flex items-center justify-center gap-2 active:brightness-90 active:scale-95 transition-all duration-200 text-sm"
            >
              <Wallet size={18} />
              Buy Now
            </Link>
          </div>
        )}
      </motion.div>

      <div className="md:hidden h-32" />
    </>
  );
}
