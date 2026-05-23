"use client";

import { motion } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "Cleanse",
    description: "Start with our gentle cleanser to remove impurities",
    icon: "🧴",
  },
  {
    number: "02",
    title: "Tone",
    description: "Use the balancing toner to restore skin's pH",
    icon: "💧",
  },
  {
    number: "03",
    title: "Treat",
    description: "Apply the serum or mask for targeted benefits",
    icon: "✨",
  },
  {
    number: "04",
    title: "Moisturize",
    description: "Seal with our luxurious day or night cream",
    icon: "🧴",
  },
];

export default function HowToUse() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  return (
    <section className="py-16 sm:py-24 bg-cream">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="font-heading text-3xl sm:text-5xl text-dark-text mb-4">
            How to Use
          </h2>
          <p className="text-lg text-light-text max-w-2xl mx-auto">
            Follow our simple 4-step routine for optimal results
          </p>
        </motion.div>

        {/* Steps */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8"
        >
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              variants={itemVariants}
              whileHover={{ y: -8 }}
              className="relative"
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-20 left-full w-4 h-1 bg-gold/30"></div>
              )}

              <div className="bg-white rounded-2xl p-6 sm:p-8 h-full shadow-md hover:shadow-lg transition-shadow duration-300">
                {/* Number */}
                <div className="text-5xl sm:text-6xl font-heading text-gold/20 mb-4">
                  {step.number}
                </div>

                {/* Icon */}
                <div className="text-4xl mb-4">{step.icon}</div>

                {/* Content */}
                <h3 className="font-heading text-xl text-dark-text mb-2">
                  {step.title}
                </h3>
                <p className="text-light-text text-sm sm:text-base">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12 sm:mt-16"
        >
          <button className="px-8 py-4 bg-gold text-white font-semibold rounded-lg hover:bg-opacity-90 transition-all duration-300 transform hover:scale-105">
            Get the Complete Routine
          </button>
        </motion.div>
      </div>
    </section>
  );
}
