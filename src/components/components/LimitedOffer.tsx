"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function LimitedOffer() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const endTime = new Date();
      endTime.setDate(endTime.getDate() + 3);

      const diff = endTime.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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
    <section className="py-16 sm:py-24 bg-gradient-to-r from-gold/10 to-gold/5 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center"
        >
          {/* Badge */}
          <motion.div
            variants={itemVariants}
            className="inline-block bg-gold text-white px-4 py-2 rounded-full text-sm font-semibold mb-6"
          >
            ⚡ Limited Time Offer
          </motion.div>

          {/* Heading */}
          <motion.h2
            variants={itemVariants}
            className="font-heading text-4xl sm:text-6xl text-dark-text mb-4"
          >
            Premium Bundle Deal
          </motion.h2>

          {/* Subheading */}
          <motion.p
            variants={itemVariants}
            className="text-xl sm:text-2xl text-light-text mb-8"
          >
            Get 30% off on complete skincare routine
          </motion.p>

          {/* Countdown Timer */}
          <motion.div
            variants={itemVariants}
            className="flex justify-center gap-4 sm:gap-8 mb-10 sm:mb-12 flex-wrap"
          >
            {Object.entries(timeLeft).map(([unit, value]) => (
              <div key={unit} className="flex flex-col items-center">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-white rounded-2xl p-4 sm:p-6 min-w-20 sm:min-w-24 shadow-lg"
                >
                  <div className="font-heading text-3xl sm:text-5xl text-gold font-bold">
                    {String(value).padStart(2, "0")}
                  </div>
                </motion.div>
                <p className="text-sm sm:text-base text-light-text uppercase tracking-wider mt-3 font-semibold">
                  {unit}
                </p>
              </div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link
              href="#products"
              className="px-8 sm:px-10 py-4 bg-gold text-white font-bold rounded-lg hover:bg-opacity-90 transition-all duration-300 transform hover:scale-105 shadow-lg text-base sm:text-lg w-full sm:w-auto"
            >
              Shop Now & Save 30%
            </Link>
            <button className="px-8 sm:px-10 py-4 border-2 border-gold text-gold font-bold rounded-lg hover:bg-gold hover:text-white transition-all duration-300 text-base sm:text-lg w-full sm:w-auto">
              Learn More
            </button>
          </motion.div>

          {/* Urgency Message */}
          <motion.p
            variants={itemVariants}
            className="text-red-600 font-semibold mt-6 text-sm sm:text-base"
          >
            ⚠️ Only 50 bundles left at this price!
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
