"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Priya Sharma",
    role: "Beauty Influencer",
    rating: 5,
    text: "BijNoor products have transformed my skincare routine. The quality is unmatched, and I love that they're completely natural.",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
  },
  {
    name: "Aisha Patel",
    role: "Verified Customer",
    rating: 5,
    text: "Finally found skincare that actually works without harsh chemicals. My skin has never been clearer!",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
  },
  {
    name: "Ravi Kumar",
    role: "Skincare Enthusiast",
    rating: 5,
    text: "As a guy who cares about skincare, BijNoor's products are amazing. Subtle packaging, premium quality.",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
  },
  {
    name: "Neha Gupta",
    role: "Verified Customer",
    rating: 4,
    text: "Love the sustainability focus. Products are great and the environmental commitment sets them apart.",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
  },
];

export default function Reviews() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5 },
    },
  };

  return (
    <section className="py-16 sm:py-24 bg-beige/30">
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
            Loved by Customers
          </h2>
          <p className="text-lg text-light-text max-w-2xl mx-auto">
            Join thousands of satisfied customers who've experienced the BijNoor difference
          </p>
        </motion.div>

        {/* Reviews Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8"
        >
          {testimonials.map((review, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              whileHover={{ y: -8 }}
              className="bg-white rounded-2xl p-6 sm:p-8 shadow-md hover:shadow-xl transition-shadow duration-300"
            >
              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(review.rating)].map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    className="fill-gold text-gold"
                  />
                ))}
              </div>

              {/* Review Text */}
              <p className="text-light-text mb-6 text-sm sm:text-base leading-relaxed italic">
                "{review.text}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <img
                  src={review.image}
                  alt={review.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold text-dark-text">{review.name}</p>
                  <p className="text-sm text-light-text">{review.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12 sm:mt-16"
        >
          <p className="text-light-text mb-4">Join our growing community</p>
          <div className="inline-flex items-center gap-2 text-brand-green font-semibold">
            ★★★★★ 4.9 out of 5 stars from 10,000+ reviews
          </div>
        </motion.div>
      </div>
    </section>
  );
}
