"use client";

import { useEffect, useMemo, useState } from "react";
import { defaultReviews, productInfo } from "@/lib/bijnoor-content";
import { useCart } from "@/context/CartContext";
import { Product } from "@/types";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";

interface ProductHeroProps {
  onBuyNow?: (selection: { quantity: number; productName: string; unitPrice: number }) => void;
  onSelectionChange?: (selection: { quantity: number; productName: string; unitPrice: number }) => void;
}

type HeroProductApi = {
  slug: string;
  name: string;
  description: string;
  category: string;
  price: number;
  originalPrice?: number;
  launchSoon?: boolean;
  stock?: number;
  images?: { url: string }[];
};

export default function ProductHero({ onBuyNow, onSelectionChange }: ProductHeroProps) {
  const { addToCart } = useCart();
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [variant, setVariant] = useState("single");
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [featuredProduct, setFeaturedProduct] = useState<HeroProductApi | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  const basePrice = Math.max(1, Number(featuredProduct?.price || 399));
  const baseMrp = Math.max(basePrice + 1, Number(featuredProduct?.originalPrice || 649));
  const maxAllowedQuantity = Math.max(1, Math.min(5, Number(featuredProduct?.stock || 5)));
  const isLaunchingSoon = Boolean(featuredProduct?.launchSoon);
  const isInStock = Number(featuredProduct?.stock ?? 1) > 0;
  const isPurchasable = !isLaunchingSoon && isInStock;
  const previewReviews = defaultReviews.slice(0, 5);
  const reviewPreview = previewReviews[previewIndex] || defaultReviews[0];
  const previewRating = Math.min(5, Math.max(1, Math.round(Number(reviewPreview.rating) || 5)));
  const variantConfig = {
    single: { label: "Single Pack (1 Jar)", price: basePrice, mrp: baseMrp },
    duo: { label: "Duo Pack (2 Jars)", price: Math.round(basePrice * 1.75), mrp: baseMrp * 2 },
  } as const;
  const selectedVariant = variantConfig[variant as keyof typeof variantConfig];
  const discountPercent = Math.round(((selectedVariant.mrp - selectedVariant.price) / selectedVariant.mrp) * 100);
  const heroName = featuredProduct?.name || productInfo.name;
  const heroTagline = featuredProduct?.description || productInfo.tagline;
  const heroImages = useMemo(() => {
    const images = (featuredProduct?.images || []).filter((image) => Boolean(image.url));
    const uploaded = images.filter((image) => image.url.startsWith("/uploads/products/"));
    if (uploaded.length > 0) {
      return uploaded;
    }
    return images;
  }, [featuredProduct?.images]);
  const heroImageUrl = heroImages[selectedImageIndex]?.url || heroImages[0]?.url || productInfo.imageUrl;

  const cartProduct: Product = {
    id: variant === "single" ? "hero-bijnoor-single" : "hero-bijnoor-duo",
    slug: featuredProduct?.slug,
    name: variant === "single" ? heroName : `${heroName} (Duo Pack)`,
    price: selectedVariant.price,
    description: heroTagline,
    image: heroImageUrl,
    category: featuredProduct?.category || "masks",
    ingredients: ["Amla", "Bhringraj", "Aloe Vera", "Coconut Oil"],
    benefits: ["Hair Repair", "Frizz Control", "Deep Nourishment", "Chemical Free"],
    stock: Number(featuredProduct?.stock || 0),
    launchSoon: isLaunchingSoon,
  };

  useEffect(() => {
    const fetchFeaturedProduct = async () => {
      try {
        const response = await fetch("/api/products?limit=100&sort=latest", {
          cache: "no-store",
        });
        const data = await response.json();
        if (!response.ok) return;

        const products = (data.products || []) as HeroProductApi[];
        const preferredProduct =
          products.find((item) => item.slug === "bijnoor-natural-hair-mask") ||
          products.find((item) => item.name.toLowerCase().includes("bijnoor natural hair mask")) ||
          products.find((item) => item.category === "masks") ||
          products[0];

        if (preferredProduct) {
          setFeaturedProduct(preferredProduct);
        }
      } catch {
        // Keep static content if API fetch fails.
      }
    };

    fetchFeaturedProduct();
  }, []);

  useRealtimeSync({
    onEvent: (event) => {
      if (event.entity !== 'product') {
        return;
      }

      void (async () => {
        try {
          const response = await fetch('/api/products?limit=100&sort=latest', {
            cache: 'no-store',
          });
          const data = await response.json();
          if (!response.ok) return;

          const products = (data.products || []) as HeroProductApi[];
          const preferredProduct =
            products.find((item) => item.slug === 'bijnoor-natural-hair-mask') ||
            products.find((item) => item.name.toLowerCase().includes('bijnoor natural hair mask')) ||
            products.find((item) => item.category === 'masks') ||
            products[0];

          if (preferredProduct) {
            setFeaturedProduct(preferredProduct);
          }
        } catch {
          // Keep the previous hero content if the refresh fails.
        }
      })();
    },
  });

  useEffect(() => {
    onSelectionChange?.({
      quantity,
      productName: cartProduct.name,
      unitPrice: selectedVariant.price,
    });
  }, [onSelectionChange, quantity, cartProduct.name, selectedVariant.price]);

  useEffect(() => {
    setQuantity((prev) => Math.min(prev, maxAllowedQuantity));
  }, [maxAllowedQuantity]);

  function handleAddToCart() {
    if (!isPurchasable) return;
    addToCart(cartProduct, quantity);
    setIsAdded(true);
    window.setTimeout(() => setIsAdded(false), 1500);
  }

  function handleBuyNow() {
    if (!isPurchasable) return;
    onBuyNow?.({
      quantity,
      productName: cartProduct.name,
      unitPrice: selectedVariant.price,
    });
  }

  function goToNextReview() {
    setPreviewIndex((prev) => (prev + 1) % previewReviews.length);
  }

  function goToPrevReview() {
    setPreviewIndex((prev) => (prev - 1 + previewReviews.length) % previewReviews.length);
  }

  function handleReviewSwipeEnd() {
    if (touchStartX === null || touchEndX === null) return;
    const distance = touchStartX - touchEndX;
    if (Math.abs(distance) < 50) return;

    if (distance > 0) {
      goToNextReview();
      return;
    }

    goToPrevReview();
  }

  useEffect(() => {
    if (previewReviews.length <= 1) return;
    const timer = window.setInterval(() => {
      setPreviewIndex((prev) => (prev + 1) % previewReviews.length);
    }, 3500);

    return () => window.clearInterval(timer);
  }, [previewReviews.length]);

  useEffect(() => {
    setSelectedImageIndex(0);
  }, [featuredProduct?.slug]);

  useEffect(() => {
    if (selectedImageIndex <= heroImages.length - 1) return;
    setSelectedImageIndex(0);
  }, [heroImages.length, selectedImageIndex]);

  return (
    <section className="relative overflow-hidden bg-cream pt-16 pb-12 sm:pt-24 sm:pb-20">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-beige/60 to-transparent" />

      <div className="container relative mx-auto px-3 sm:px-6">
        <div className="mx-auto grid max-w-6xl items-start gap-6 rounded-3xl border border-beige bg-white p-4 shadow-sm sm:gap-8 sm:p-8 lg:grid-cols-2 lg:items-stretch lg:gap-10">
          <div className="rounded-3xl border border-beige bg-cream/80 p-3.5 sm:p-6 lg:flex lg:h-full lg:flex-col">
            <button
              type="button"
              onClick={() => setIsZoomOpen(true)}
              className="group block w-full aspect-square overflow-hidden rounded-2xl border border-beige bg-white shadow-sm"
              aria-label="Open product image zoom"
            >
              <img
                src={heroImageUrl}
                alt={`${heroName} product`}
                className="h-full w-full object-cover p-2 transition-transform duration-500 group-hover:scale-[1.02] sm:object-contain sm:p-4"
                loading="lazy"
              />
            </button>
            <p className="mt-2 text-[11px] text-dark-text/60 sm:text-xs">Tap image to zoom</p>

            {heroImages.length > 1 ? (
              <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5">
                {heroImages.slice(0, 5).map((image, index) => (
                  <button
                    key={`${image.url}-${index}`}
                    type="button"
                    onClick={() => setSelectedImageIndex(index)}
                    className={`aspect-square overflow-hidden rounded-lg border ${
                      index === selectedImageIndex ? "border-gold" : "border-beige"
                    }`}
                    aria-label={`View image ${index + 1}`}
                  >
                    <img src={image.url} alt={`${heroName} preview ${index + 1}`} className="h-full w-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            ) : null}

            <div className="mt-4 grid grid-cols-2 gap-2.5 text-sm sm:gap-4 sm:text-base">
              <div className="rounded-2xl border border-beige bg-white p-3 shadow-[0_1px_0_rgba(27,94,32,0.08)] sm:p-4">
                <p className="text-[10px] uppercase tracking-[0.1em] text-light-text/85 sm:text-[11px] sm:tracking-[0.14em]">Breakage Control</p>
                <p className="mt-1 text-lg font-bold text-gold sm:text-2xl">-90%</p>
              </div>
              <div className="rounded-2xl border border-beige bg-white p-3 shadow-[0_1px_0_rgba(27,94,32,0.08)] sm:p-4">
                <p className="text-[10px] uppercase tracking-[0.1em] text-light-text/85 sm:text-[11px] sm:tracking-[0.14em]">Healthy Shine</p>
                <p className="mt-1 text-lg font-bold text-gold sm:text-2xl">+85%</p>
              </div>
            </div>

            <div className="mt-4 hidden flex-1 rounded-2xl border border-beige bg-white p-4 lg:flex lg:flex-col lg:gap-4">
              <div className="rounded-xl border border-[#dbe9df] bg-[#fbfdfb] p-3">
                <p className="text-[10px] uppercase tracking-[0.12em] text-light-text/80">Why customers choose this</p>
                <ul className="mt-2.5 space-y-1.5 text-sm text-dark-text/85">
                  <li>Natural ingredients and no harsh chemicals</li>
                  <li>Visible softness and shine from early use</li>
                  <li>Works across dry, frizzy and damaged hair types</li>
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-[#dbe9df] bg-[#f7fbf8] p-3">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-light-text/80">Routine</p>
                  <p className="mt-1 text-sm font-semibold text-[#23472f]">2-3 times/week</p>
                </div>
                <div className="rounded-xl border border-[#dbe9df] bg-[#f7fbf8] p-3">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-light-text/80">Hair Type</p>
                  <p className="mt-1 text-sm font-semibold text-[#23472f]">All hair types</p>
                </div>
              </div>

              <div className="rounded-xl border border-[#d9e7dc] bg-[#f8fcf9] p-3">
                <p className="text-[10px] uppercase tracking-[0.12em] text-light-text/80">How to use</p>
                <div className="mt-2.5 space-y-2 text-xs text-[#355540]">
                  <p><span className="font-semibold">1.</span> Apply from roots to lengths on clean damp hair.</p>
                  <p><span className="font-semibold">2.</span> Leave for 20-30 minutes for deep nourishment.</p>
                  <p><span className="font-semibold">3.</span> Rinse well and style as usual.</p>
                </div>
              </div>

              <div className="mt-auto rounded-xl border border-[#d9e7dc] bg-[#f8fcf9] px-3 py-2 text-xs font-semibold text-[#2f5f42]">
                Free shipping + secure UPI checkout available
              </div>
            </div>
          </div>

          <div className="animate-fadeIn">
            <p className="mb-3 inline-block rounded-full bg-gold px-3 py-1 text-[11px] font-semibold text-white shadow-[0_4px_12px_rgba(46,125,50,0.2)] sm:px-4 sm:text-sm">
              Natural Hair Care
            </p>
            <h1 className="font-heading text-[1.9rem] leading-[1.07] text-dark-text sm:text-5xl lg:text-6xl">
              {heroName}
            </h1>
            <p className="mt-3 max-w-xl text-[15px] font-medium leading-relaxed text-light-text sm:mt-4 sm:text-lg">{heroTagline}</p>

            <div className="mt-5 rounded-2xl border border-beige bg-cream p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-light-text">Rating</p>
              <p className="mt-2 text-sm font-semibold text-dark-text">{productInfo.ratingLabel}</p>
            </div>

            <div className="mt-4 rounded-2xl border border-beige bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-light-text">Price + Discount</p>
              {isLaunchingSoon ? (
                <p className="mt-2 text-xl font-semibold text-dark-text">Launching Soon</p>
              ) : (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="text-3xl font-bold text-gold">₹{selectedVariant.price}</span>
                  <span className="text-sm text-light-text line-through">₹{selectedVariant.mrp}</span>
                  <span className="rounded-full bg-[#e8f5e9] px-2 py-1 text-xs font-semibold text-[#1f6f3d]">
                    Save {discountPercent}%
                  </span>
                </div>
              )}
              <p className={`mt-2 text-sm font-semibold ${isPurchasable ? "text-[#1f6f3d]" : "text-[#8b5e3b]"}`}>
                {isLaunchingSoon ? "Launching Soon" : isInStock ? `In stock (${featuredProduct?.stock ?? 0})` : "Currently out of stock"}
              </p>
            </div>

            <div className="mt-4 rounded-2xl border border-beige bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-light-text">Variant Selector</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {Object.entries(variantConfig).map(([key, option]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setVariant(key)}
                    className={`rounded-xl border px-4 py-2 text-left text-sm font-semibold ${
                      variant === key ? "border-gold bg-cream text-dark-text" : "border-beige bg-white text-light-text"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-beige bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-light-text">Quantity</p>
              <div className="mt-2 inline-flex items-center gap-3 rounded-xl border border-beige bg-cream px-3 py-2">
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  className="h-9 w-9 rounded-lg border border-beige bg-white text-lg font-bold text-dark-text"
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className="min-w-8 text-center text-lg font-semibold text-dark-text">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => Math.min(maxAllowedQuantity, prev + 1))}
                  className="h-9 w-9 rounded-lg border border-beige bg-white text-lg font-bold text-dark-text"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-3">
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={!isPurchasable}
                className={`w-full rounded-xl px-5 py-2.5 text-center text-sm font-bold sm:w-auto sm:px-6 sm:py-3 ${
                  isPurchasable
                    ? "bg-gold text-white shadow-[0_8px_20px_rgba(46,125,50,0.22)] hover:brightness-95"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                }`}
              >
                {isLaunchingSoon ? "Launching Soon" : isInStock ? "Buy Now" : "Out of Stock"}
              </button>
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!isPurchasable}
                className={`w-full rounded-xl border border-beige px-5 py-2.5 text-center text-sm font-semibold sm:w-auto sm:px-6 sm:py-3 ${
                  isAdded
                    ? "bg-[#e8f5e9] text-[#1f6f3d]"
                    : !isPurchasable
                    ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                    : "bg-white text-dark-text hover:bg-cream"
                }`}
              >
                {isAdded ? "Added to Cart" : "Add to Cart"}
              </button>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-[#cfe1d2] bg-gradient-to-br from-[#f8fcf8] via-[#f3faf5] to-[#eef7f1] p-4 shadow-[0_10px_24px_rgba(31,111,61,0.12)]">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#4f6d58]">Review Preview</p>
                <span className="rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#1f6f3d]">
                  Verified
                </span>
              </div>

              <div
                className="mt-3 rounded-2xl border border-[#d9e8dd] bg-white p-4 transition-all duration-300"
                onTouchStart={(event) => {
                  setTouchEndX(null);
                  setTouchStartX(event.targetTouches[0].clientX);
                }}
                onTouchMove={(event) => setTouchEndX(event.targetTouches[0].clientX)}
                onTouchEnd={handleReviewSwipeEnd}
              >
                <p className="text-2xl leading-none text-[#90b69a]">"</p>
                <p className="mt-1 text-[15px] leading-relaxed text-[#2b3e2f]">{reviewPreview.text}</p>
                <div className="mt-4 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e4f2e8] text-xs font-bold text-[#1f6f3d]">
                      {reviewPreview.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#26422f]">{reviewPreview.name}</p>
                      {reviewPreview.location ? (
                        <p className="text-[10px] uppercase tracking-wide text-[#5f7866]">{reviewPreview.location}</p>
                      ) : null}
                      <p className="text-[11px] text-brand-green">
                        {"★".repeat(previewRating)}
                        <span className="text-light-text">{"☆".repeat(5 - previewRating)}</span>
                      </p>
                    </div>
                  </div>
                  <p className="text-[11px] font-semibold text-[#5f7866]">Swipe to see more</p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-[11px] text-[#5f7866]">Review {previewIndex + 1} of {previewReviews.length}</p>
                <a href="#reviews" className="text-xs font-semibold text-[#1f6f3d] underline-offset-4 hover:underline">
                  Jump to Full Reviews
                </a>
              </div>
            </div>

            <p className="mt-4 text-[11px] leading-relaxed text-dark-text/70 sm:mt-5 sm:text-xs">{productInfo.disclaimer}</p>
          </div>
        </div>
      </div>

      {isZoomOpen ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 px-4"
          onClick={() => setIsZoomOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Product image zoom"
        >
          <div className="relative w-full max-w-4xl" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              onClick={() => setIsZoomOpen(false)}
              className="absolute right-2 top-2 rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-dark-text"
            >
              Close
            </button>
            <img
              src={heroImageUrl}
              alt={`${heroName} enlarged`}
              className="max-h-[85vh] w-full rounded-2xl object-contain"
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
