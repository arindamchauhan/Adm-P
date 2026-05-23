import { trustIndicators } from "@/lib/bijnoor-content";

export default function TrustSection() {
  return (
    <section className="bg-cream py-8 sm:py-10">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          {trustIndicators.map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-beige bg-white p-5 text-center shadow-sm"
            >
              <p className="text-sm font-semibold text-light-text sm:text-base">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
