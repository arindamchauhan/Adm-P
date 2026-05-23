import { performanceIndicators } from "@/lib/bijnoor-content";

export default function ResultsSection() {
  return (
    <section id="results" className="bg-white py-14 sm:py-16">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center font-heading text-3xl text-dark-text sm:text-4xl">
            Result Timeline
          </h2>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-beige bg-cream p-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-light-text">Before</h3>
              <p className="mt-3 text-sm text-dark-text/80 sm:text-base">
                Hair felt rough, looked dull, and was more prone to breakage.
              </p>
            </div>
            <div className="rounded-2xl border border-beige bg-cream p-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-light-text">After</h3>
              <p className="mt-3 text-sm text-dark-text/80 sm:text-base">
                Hair appears shinier, feels softer, and is visibly easier to manage.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {performanceIndicators.map((metric) => (
              <div
                key={metric}
                className="rounded-xl border border-beige bg-cream p-4 text-center text-sm font-semibold text-light-text"
              >
                {metric}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
