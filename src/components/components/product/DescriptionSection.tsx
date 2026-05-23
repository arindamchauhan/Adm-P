import { productInfo } from "@/lib/bijnoor-content";

export default function DescriptionSection() {
  return (
    <section id="description" className="bg-beige py-14 sm:py-16">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mx-auto max-w-4xl rounded-2xl border border-beige bg-white p-6 sm:p-8">
          <h2 className="font-heading text-3xl text-dark-text sm:text-4xl">Description</h2>
          <p className="mt-4 text-sm leading-relaxed text-light-text sm:text-base">
            {productInfo.description}
          </p>
        </div>
      </div>
    </section>
  );
}
