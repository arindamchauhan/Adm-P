"use client";

import { motion } from "framer-motion";
import { Leaf, Sparkles, Globe, Shield } from "lucide-react";

const benefits = [
  {
    icon: Leaf,
    title: "100% Natural",
    description: "Pure ingredients sourced sustainably from nature",
  },
  {
    icon: Shield,
    title: "Chemical Free",
    description: "No harmful chemicals, parabens, or synthetic additives",
  },
  {
    icon: Globe,
    title: "Sustainable",
    description: "Eco-conscious sourcing and packaging",
  },
  {
    icon: Sparkles,
    title: "Premium Quality",
    description: "Carefully crafted by beauty experts worldwide",
  },
];

export default function Benefits() {
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
    <section className="py-16 sm:py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mb-12 sm:mb-16"
        >
          <motion.h2
            variants={itemVariants}
            className="font-heading text-3xl sm:text-5xl text-dark-text mb-4"
          >
            Why Choose BijNoor?
          </motion.h2>
          <motion.p
            variants={itemVariants}
            className="text-lg text-light-text max-w-2xl mx-auto"
          >
            We believe in the power of nature combined with scientific innovation
          </motion.p>
        </motion.div>

        {/* Benefits Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8"
        >
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <motion.div
                key={benefit.title}
                variants={itemVariants}
                whileHover={{ y: -8 }}
                className="bg-cream rounded-2xl p-6 sm:p-8 text-center hover:shadow-lg transition-shadow duration-300"
              >
                <motion.div
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                  className="inline-flex"
                >
                  <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-gold" />
                  </div>
                </motion.div>
                <h3 className="font-heading text-xl text-dark-text mb-3">
                  {benefit.title}
                </h3>
                <p className="text-light-text text-sm sm:text-base">
                  {benefit.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
