"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.18, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
};

export default function Hero() {
  return (
    <section className="relative w-full min-h-[100svh] bg-gradient-to-b from-cream via-beige/40 to-cream overflow-hidden flex items-center">
      {/* Decorative blobs — hidden on small to avoid distraction on mobile */}
      <div className="hidden sm:block absolute top-0 right-0 w-72 lg:w-96 h-72 lg:h-96 bg-gold/10 rounded-full blur-3xl pointer-events-none" />
      <div className="hidden sm:block absolute bottom-0 left-0 w-56 lg:w-72 h-56 lg:h-72 bg-gold/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 py-16 sm:py-20 w-full">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          /* Mobile: column-first. Desktop: row side-by-side */
          className="flex flex-col-reverse lg:flex-row items-center justify-between gap-8 lg:gap-12"
        >
          {/* ── TEXT SIDE ─────────────────────────────────── */}
          <motion.div
            variants={itemVariants}
            className="flex-1 w-full text-center lg:text-left"
          >
            {/* Pill badge */}
            <motion.div
              variants={itemVariants}
              className="inline-block bg-gold/10 text-gold text-xs sm:text-sm font-semibold px-4 py-1.5 rounded-full mb-5 lg:mb-6"
            >
              ✦ Pure • Natural • Premium
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="font-heading text-[2.6rem] leading-[1.1] sm:text-5xl lg:text-7xl text-dark-text mb-4 sm:mb-5"
            >
              Premium
              <br className="hidden sm:block" /> Natural Beauty
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-base sm:text-lg text-light-text mb-7 sm:mb-8 max-w-md mx-auto lg:mx-0 leading-relaxed"
            >
              Discover the luxury of pure, naturally-sourced skincare. Crafted with
              intention, formulated for transformation.
            </motion.p>

            {/* CTAs — stack on mobile, row on sm+ */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center justify-center lg:justify-start"
            >
              <Link
                href="#products"
                className="flex items-center justify-center px-8 py-4 bg-gold text-white font-semibold rounded-xl hover:brightness-105 active:scale-95 transition-all duration-200 shadow-lg shadow-gold/25 text-base"
              >
                Shop Now
              </Link>
              <Link
                href="#story"
                className="flex items-center justify-center px-8 py-4 border-2 border-gold text-gold font-semibold rounded-xl hover:bg-gold hover:text-white active:scale-95 transition-all duration-200 text-base"
              >
                Our Story
              </Link>
            </motion.div>

            {/* Trust strip */}
            <motion.div
              variants={itemVariants}
              className="mt-10 sm:mt-12 grid grid-cols-3 gap-3 sm:gap-6 text-center lg:text-left border-t border-beige pt-8"
            >
              {[
                { value: "100%", label: "Natural" },
                { value: "10K+", label: "Happy Customers" },
                { value: "4.9★", label: "Avg Rating" },
              ].map((stat) => (
                <div key={stat.value}>
                  <p className="text-xl sm:text-3xl font-bold text-gold leading-none mb-1">
                    {stat.value}
                  </p>
                  <p className="text-xs sm:text-sm text-light-text">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* ── IMAGE SIDE ────────────────────────────────── */}
          <motion.div
            variants={itemVariants}
            className="flex-1 w-full flex justify-center items-center"
          >
            <motion.div
              animate={{ y: [0, -14, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
              className="relative w-full max-w-xs sm:max-w-sm lg:max-w-lg aspect-square"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-gold/15 to-transparent rounded-3xl" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1570554886111-e80fcca6a029?w=700&h=700&fit=crop&auto=format"
                alt="BijNoor premium skincare product"
                loading="eager"
                width={700}
                height={700}
                className="w-full h-full object-cover rounded-3xl shadow-2xl"
              />
              {/* Floating badge */}
              <div className="absolute -bottom-3 -left-3 sm:bottom-4 sm:left-4 bg-white rounded-2xl px-3 sm:px-4 py-2 sm:py-3 shadow-xl flex items-center gap-2">
                <span className="text-xl">🌿</span>
                <div>
                  <p className="text-xs font-bold text-dark-text leading-none">Chemical Free</p>
                  <p className="text-[10px] text-light-text">100% Organic</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll arrow — only desktop */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 text-gold text-center hidden lg:flex flex-col items-center gap-1"
        aria-hidden="true"
      >
        <p className="text-xs font-semibold tracking-widest uppercase opacity-60">Scroll</p>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </motion.div>
    </section>
  );
}
