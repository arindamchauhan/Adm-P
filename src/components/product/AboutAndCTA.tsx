"use client";

import { useEffect, useState } from "react";
import { aboutInfo } from "@/lib/bijnoor-content";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";

const DEFAULT_CONTACT_EMAIL = aboutInfo.email;

export default function AboutAndCTA() {
  const [contactEmail, setContactEmail] = useState(DEFAULT_CONTACT_EMAIL);

  useEffect(() => {
    const loadContactEmail = async () => {
      try {
        const res = await fetch("/api/site-settings");
        const data = await res.json();
        if (!res.ok || !data.settings) return;

        const nextEmail = String(data.settings.contactEmail || DEFAULT_CONTACT_EMAIL).trim();
        if (nextEmail) {
          setContactEmail(nextEmail);
        }
      } catch {
        // Keep fallback content email.
      }
    };

    loadContactEmail();
  }, []);

  useRealtimeSync({
    onEvent: (event) => {
      if (event.entity !== 'site-settings') {
        return;
      }

      void (async () => {
        try {
          const res = await fetch('/api/site-settings');
          const data = await res.json();
          if (!res.ok || !data.settings) return;

          const nextEmail = String(data.settings.contactEmail || DEFAULT_CONTACT_EMAIL).trim();
          if (nextEmail) {
            setContactEmail(nextEmail);
          }
        } catch {
          // Keep fallback content email.
        }
      })();
    },
  });

  return (
    <section id="about" className="bg-white py-14 sm:py-16">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-2">
          <article className="rounded-2xl border border-beige bg-beige p-6">
            <h2 className="font-heading text-3xl text-dark-text">{aboutInfo.heading}</h2>
            <p className="mt-3 text-sm leading-relaxed text-light-text sm:text-base">{aboutInfo.body}</p>
            <p className="mt-4 text-sm text-light-text">
              Contact: <a href={`mailto:${contactEmail}`} className="font-semibold underline">{contactEmail}</a>
            </p>
          </article>

          <article className="rounded-2xl bg-gold p-6 text-white shadow-lg">
            <h2 className="font-heading text-3xl">Ready to transform your hair?</h2>
            <p className="mt-3 text-sm text-white/90 sm:text-base">
              Join thousands of satisfied customers and experience natural hair care.
            </p>
            <a
              href="#order-form"
              className="mt-6 inline-block rounded-xl bg-white px-6 py-3 text-sm font-bold text-gold hover:opacity-95"
            >
              Order Now
            </a>
          </article>
        </div>
      </div>
    </section>
  );
}
