"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ShoppingCart, Menu, X, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { useTheme } from "@/context/ThemeContext";
import ThemeToggleButton from "@/components/ThemeToggleButton";
import { usePathname, useRouter } from "next/navigation";

const NAV_LINKS = [
  { label: "Products", href: "/products" },
  { label: "Results", href: "#results" },
  { label: "Reviews", href: "#reviews" },
  { label: "Order", href: "#order-form" },
  { label: "FAQ", href: "#faqs" },
  { label: "Track Order", href: "/track-order" },
  { label: "My Orders", href: "/orders" },
  { label: "About", href: "#about" },
];

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { isDark } = useTheme();
  const { getTotalItems } = useCart();
  const itemCount = getTotalItems();

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menu on resize to desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setIsMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const closeMenu = () => setIsMenuOpen(false);

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/");
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "backdrop-blur-xl shadow-sm"
            : "backdrop-blur-md"
        } border-b`}
        style={{
          paddingTop: "env(safe-area-inset-top)",
          backgroundColor: isDark
            ? isScrolled
              ? "rgba(14, 18, 16, 0.95)"
              : "rgba(14, 18, 16, 0.9)"
            : isScrolled
              ? "rgba(255, 255, 255, 0.95)"
              : "rgba(255, 255, 255, 0.9)",
          borderColor: "var(--border-soft)",
        }}
      >
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 sm:h-18">
            <div className="flex items-center gap-1.5">
              {pathname !== "/" ? (
                <button
                  type="button"
                  onClick={handleGoBack}
                  className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl hover:bg-beige/60 transition-colors duration-200"
                  aria-label="Go to previous page"
                >
                  <ArrowLeft size={20} className="text-dark-text" />
                </button>
              ) : null}

              {/* Logo */}
              <Link
                href="/"
                onClick={closeMenu}
                className="flex items-center gap-1.5 text-gold flex-shrink-0 whitespace-nowrap"
                aria-label="BijNoor Wellness Home"
              >
                <span className="font-brand text-[1.75rem] sm:text-[1.9rem] font-semibold leading-none tracking-tight">
                  BijNoor
                </span>
                <span className="font-brand text-[1.75rem] sm:text-[1.9rem] font-semibold leading-none tracking-tight">
                  Wellness
                </span>
              </Link>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-6 lg:gap-8" aria-label="Main navigation">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-dark-text hover:text-gold transition-colors duration-200 text-sm lg:text-base font-medium"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right: Cart + Hamburger */}
            <div className="flex items-center gap-1">
              <ThemeToggleButton className="hidden sm:flex items-center justify-center w-11 h-11 rounded-xl border transition-colors duration-200" />

              {/* Cart */}
              <Link
                href="/cart"
                className="relative flex items-center justify-center w-11 h-11 rounded-xl hover:bg-beige/60 transition-colors duration-200"
                aria-label={`Cart (${itemCount} items)`}
              >
                <ShoppingCart size={22} className="text-dark-text" />
                {itemCount > 0 && (
                  <motion.span
                    key={itemCount}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center"
                  >
                    {itemCount > 9 ? "9+" : itemCount}
                  </motion.span>
                )}
              </Link>

              {/* Hamburger — mobile only */}
              <button
                className="md:hidden flex items-center justify-center w-11 h-11 rounded-xl hover:bg-beige/60 transition-colors duration-200"
                onClick={() => setIsMenuOpen((v) => !v)}
                aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={isMenuOpen}
                aria-controls="mobile-menu"
              >
                {isMenuOpen ? (
                  <X size={22} className="text-dark-text" />
                ) : (
                  <Menu size={22} className="text-dark-text" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.nav
              id="mobile-menu"
              aria-label="Mobile navigation"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="md:hidden overflow-hidden bg-white border-t border-beige"
            >
              <ul className="px-4 py-4 space-y-1">
                <li>
                  <ThemeToggleButton
                    mobileLabel
                    className="w-full flex items-center justify-between min-h-[48px] px-3 rounded-xl border transition-colors duration-200 font-medium text-base"
                  />
                </li>
                {NAV_LINKS.map((link, i) => (
                  <motion.li
                    key={link.label}
                    initial={{ x: -12, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      href={link.href}
                      onClick={closeMenu}
                      className="flex items-center min-h-[48px] px-3 rounded-xl text-dark-text hover:text-gold hover:bg-beige/50 transition-all duration-200 font-medium text-base"
                    >
                      {link.label}
                    </Link>
                  </motion.li>
                ))}
                <motion.li
                  initial={{ x: -12, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: NAV_LINKS.length * 0.05 }}
                  className="pt-2"
                >
                  <Link
                    href="/cart"
                    onClick={closeMenu}
                    className="flex items-center justify-center gap-2 min-h-[52px] px-4 rounded-xl bg-gold text-white font-semibold text-base active:scale-95 transition-transform"
                  >
                    <ShoppingCart size={20} />
                    View Cart {itemCount > 0 && `(${itemCount})`}
                  </Link>
                </motion.li>
              </ul>
              {/* Safe area bottom padding for notched phones */}
              <div style={{ paddingBottom: "env(safe-area-inset-bottom)" }} />
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      {/* Backdrop overlay when menu is open */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/30 md:hidden"
            onClick={closeMenu}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>
    </>
  );
}
