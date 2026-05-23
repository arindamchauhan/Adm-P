"use client";

import { useEffect, useState } from "react";
import { defaultFaqs } from "@/lib/bijnoor-content";

type FAQItem = {
  question: string;
  answer: string;
};

export default function FAQSection() {
  const [faqs, setFaqs] = useState<FAQItem[]>(defaultFaqs);
  const [openIndex, setOpenIndex] = useState<number>(0);

  useEffect(() => {
    fetch("/api/faqs")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to load FAQs"))))
      .then((data: { faqs?: FAQItem[] }) => {
        if (Array.isArray(data.faqs) && data.faqs.length > 0) {
          setFaqs(data.faqs);
          setOpenIndex(0);
        }
      })
      .catch(() => {
        // Keep static FAQ fallback from content file.
      });
  }, []);

  return (
    <section id="faqs" className="bg-beige py-14 sm:py-16">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center font-heading text-3xl text-dark-text sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <div className="mt-8 space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = index === openIndex;
              return (
                <article
                  key={faq.question}
                  className="rounded-xl border border-beige bg-white px-4 py-3 shadow-sm sm:px-5"
                >
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-4 text-left"
                    onClick={() => setOpenIndex(isOpen ? -1 : index)}
                  >
                    <span className="text-sm font-semibold text-dark-text sm:text-base">
                      {faq.question}
                    </span>
                    <span className="text-lg font-bold text-gold">{isOpen ? "-" : "+"}</span>
                  </button>
                  {isOpen ? (
                    <p className="pt-3 text-sm leading-relaxed text-light-text sm:text-base">{faq.answer}</p>
                  ) : null}
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
