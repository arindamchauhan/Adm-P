"use client";

import { motion } from "framer-motion";

export default function BrandStory() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -30 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.8 },
    },
  };

  return (
    <section
      id="story"
      className="py-16 sm:py-24 bg-white"
    >
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center"
        >
          {/* Text Content */}
          <motion.div variants={itemVariants}>
            <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl text-dark-text mb-6">
              Our Story
            </h2>
            <p className="text-light-text text-base sm:text-lg mb-6 leading-relaxed">
              BijNoor is part of a well-established business group with years of experience building trusted consumer brands across India. With a strong operating network and long-term supplier partnerships, we have scaled quality-led products to customers in major cities, growing towns, and export-linked markets.
            </p>
            <p className="text-light-text text-base sm:text-lg mb-8 leading-relaxed">
              Our new company and flagship product line mark the next phase of expansion, bringing our proven standards in sourcing, formulation, and customer care to a wider national and international audience. Every launch is designed for consistency, compliance, and long-term brand trust.
            </p>

            {/* Values */}
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-gold font-bold">✓</span>
                </div>
                <div>
                  <h4 className="font-semibold text-dark-text mb-1">
                    100% Natural Ingredients
                  </h4>
                  <p className="text-sm text-light-text">
                    No chemicals, no compromises
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-gold font-bold">✓</span>
                </div>
                <div>
                  <h4 className="font-semibold text-dark-text mb-1">
                    Sustainable Sourcing
                  </h4>
                  <p className="text-sm text-light-text">
                    Partnering with ethical suppliers
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-gold font-bold">✓</span>
                </div>
                <div>
                  <h4 className="font-semibold text-dark-text mb-1">
                    Cruelty-Free & Vegan
                  </h4>
                  <p className="text-sm text-light-text">
                    Never tested on animals
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Image */}
          <motion.div
            variants={itemVariants}
            className="relative order-first lg:order-last"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-gold/10 to-transparent rounded-3xl"></div>
            <img
              src="https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=600&h=600&fit=crop"
              alt="BijNoor brand story"
              className="w-full rounded-3xl shadow-xl object-cover aspect-square"
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
