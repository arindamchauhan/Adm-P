"use client";

import { FormEvent, useState } from "react";

export default function NewsletterSection() {
  const [status, setStatus] = useState<string>("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const email = String(data.get("email") || "").trim();

    if (!email) return;

    const response = await fetch("/api/subscribers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (response.ok) {
      setStatus("Subscribed successfully.");
      form.reset();
      return;
    }

    const error = await response.json().catch(() => ({}));
    setStatus(error.error || "Unable to subscribe right now.");
  }

  return (
    <section className="bg-cream py-14 sm:py-16">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mx-auto max-w-4xl rounded-3xl border border-beige bg-white p-6 text-center shadow-sm sm:p-10">
          <h2 className="font-heading text-3xl text-dark-text sm:text-4xl">Stay Updated</h2>
          <p className="mt-3 text-sm text-light-text sm:text-base">
            Subscribe to receive exclusive offers, hair care tips, and product updates.
          </p>

          <form
            className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center"
            onSubmit={handleSubmit}
          >
            <input
              type="email"
              name="email"
              required
              placeholder="Email address"
              className="w-full rounded-xl border border-beige bg-cream px-4 py-3 text-sm text-dark-text outline-none focus:border-gold"
            />
            <button
              type="submit"
              className="rounded-xl bg-gold px-6 py-3 text-sm font-semibold text-white hover:brightness-95"
            >
              Subscribe
            </button>
          </form>
          {status ? <p className="mt-3 text-xs text-light-text">{status}</p> : null}
        </div>
      </div>
    </section>
  );
}
