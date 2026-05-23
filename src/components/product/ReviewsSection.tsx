"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { defaultReviews } from "@/lib/bijnoor-content";

type Review = {
  id: string;
  name: string;
  rating: number;
  text: string;
  source: string;
  location?: string;
};

function getSafeRating(value: unknown) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 5;
  return Math.min(5, Math.max(1, Math.round(numeric)));
}

export default function ReviewsSection() {
  const [reviews, setReviews] = useState<Review[]>(defaultReviews);
  const [active, setActive] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    fetch("/api/reviews")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to load reviews"))))
      .then((data: { reviews?: Review[] }) => {
        if (Array.isArray(data.reviews) && data.reviews.length > 0) {
          setReviews([...defaultReviews, ...data.reviews]);
        }
      })
      .catch(() => {
        // Keep default fallback reviews for continuity if API is unavailable.
      });
  }, []);

  useEffect(() => {
    if (isPaused || reviews.length <= 1) return;

    const timer = window.setInterval(() => {
      setActive((prev) => (prev + 1) % reviews.length);
    }, 3500);

    return () => window.clearInterval(timer);
  }, [isPaused, reviews.length]);

  const visible = useMemo(() => {
    if (reviews.length === 0) return [];
    return [
      reviews[active % reviews.length],
      reviews[(active + 1) % reviews.length],
      reviews[(active + 2) % reviews.length],
    ];
  }, [active, reviews]);

  function handleSwipeEnd() {
    if (touchStartX === null || touchEndX === null || reviews.length <= 1) return;

    const distance = touchStartX - touchEndX;
    if (Math.abs(distance) < 50) return;

    if (distance > 0) {
      setActive((prev) => (prev + 1) % reviews.length);
    } else {
      setActive((prev) => (prev - 1 + reviews.length) % reviews.length);
    }
  }

  return (
    <section id="reviews" className="bg-cream py-14 sm:py-16">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-heading text-3xl text-dark-text sm:text-4xl">Customer Reviews</h2>
              <p className="mt-2 text-sm text-light-text sm:text-base">
                Verified written feedback from real customers.
              </p>
            </div>
            <div className="flex gap-2">
              <a
                href="#reviews"
                className="rounded-lg border border-beige bg-white px-4 py-2 text-sm font-semibold text-gold hover:bg-beige"
              >
                View More Reviews
              </a>
              <a
                href="#add-review"
                className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-white hover:brightness-95"
              >
                Add Your Review
              </a>
            </div>
          </div>

          <div
            className="mt-8"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onFocusCapture={() => setIsPaused(true)}
            onBlurCapture={() => setIsPaused(false)}
            onTouchStart={(e) => {
              setIsPaused(true);
              setTouchEndX(null);
              setTouchStartX(e.targetTouches[0].clientX);
            }}
            onTouchMove={(e) => setTouchEndX(e.targetTouches[0].clientX)}
            onTouchEnd={handleSwipeEnd}
          >
            <div className="grid gap-4 md:grid-cols-3">
              {visible.map((review) => {
                const safeRating = getSafeRating(review.rating);
                return (
                  <article
                    key={review.id}
                    className="rounded-2xl border border-beige bg-beige p-5 shadow-sm"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-base font-semibold text-dark-text">{review.name}</h3>
                      <p className="text-sm font-bold text-brand-green">
                        {"★".repeat(safeRating)}
                        <span className="text-light-text">{"☆".repeat(5 - safeRating)}</span>
                      </p>
                    </div>
                    {review.location ? (
                      <p className="-mt-1 mb-2 text-[10px] uppercase tracking-wide text-light-text">
                        {review.location}
                      </p>
                    ) : null}
                    <p className="text-sm leading-relaxed text-dark-text">{review.text}</p>
                    <p className="mt-3 text-xs font-medium text-light-text">
                      {review.source.toLowerCase().includes("instagram") ? "Verified customer review" : review.source}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>

          <form
            id="add-review"
            className="mt-8 rounded-2xl border border-beige bg-white p-5 shadow-sm sm:p-6"
            onSubmit={async (event) => {
              event.preventDefault();
              const form = event.currentTarget;
              const formData = new FormData(form);
              const payload = {
                name: String(formData.get("name") || "").trim(),
                rating: Number(formData.get("rating") || 5),
                text: String(formData.get("text") || "").trim(),
                source: "Written review",
                location: String(formData.get("location") || "").trim(),
              };

              const response = await fetch("/api/reviews", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              });

              if (response.ok) {
                const data = await response.json();
                if (data.review) {
                  setReviews((prev) => [data.review, ...prev]);
                }
                form.reset();
                setIsPaused(false);
              }
            }}
          >
            <h3 className="text-lg font-semibold text-dark-text">Add Your Review</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <input
                name="name"
                required
                placeholder="Your name"
                className="rounded-lg border border-beige bg-cream px-3 py-2 text-sm outline-none focus:border-gold"
              />
              <input
                name="location"
                placeholder="Location"
                className="rounded-lg border border-beige bg-cream px-3 py-2 text-sm outline-none focus:border-gold"
              />
              <select
                name="rating"
                defaultValue="5"
                className="rounded-lg border border-beige bg-cream px-3 py-2 text-sm outline-none focus:border-gold"
              >
                <option value="5">5 stars</option>
                <option value="4">4 stars</option>
                <option value="3">3 stars</option>
              </select>
              <button
                type="submit"
                className="sm:col-span-3 rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-white hover:brightness-95"
              >
                Submit Review
              </button>
            </div>
            <textarea
              name="text"
              required
              placeholder="Share your experience"
              className="mt-3 min-h-[90px] w-full rounded-lg border border-beige bg-cream px-3 py-2 text-sm outline-none focus:border-gold"
            />
          </form>
        </div>
      </div>
    </section>
  );
}
