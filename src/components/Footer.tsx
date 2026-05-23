"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from "lucide-react";

const footerLinks = {
  Company: [
    { label: "About Us", href: "/about-us" },
    { label: "Our Story", href: "/our-story" },
    { label: "Careers", href: "/careers" },
  ],
  Support: [
    { label: "Help Center", href: "/help-center" },
    { label: "Contact Us", href: "/contact-us" },
    { label: "Track Order", href: "/track-order" },
    { label: "Returns", href: "/returns" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms of Service", href: "/terms-of-service" },
    { label: "Cookie Policy", href: "/cookie-policy" },
    { label: "Shipping Info", href: "/shipping-info" },
  ],
};

export default function Footer() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  return (
    <footer className="bg-dark-text text-white">
      {/* Newsletter */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="border-b border-white/10 py-12 sm:py-16"
      >
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="font-heading text-2xl sm:text-3xl mb-2">
                Subscribe to Our Newsletter
              </h3>
              <p className="text-white/60">
                Get exclusive updates, tips, and special offers delivered to your inbox.
              </p>
            </div>
            <form className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 px-4 sm:px-6 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-gold text-base"
              />
              <button
                type="submit"
                className="px-6 sm:px-8 py-3 bg-gold text-dark-text font-semibold rounded-lg hover:brightness-105 active:scale-95 transition-all duration-200 min-h-[44px]"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </motion.div>

      {/* Main Footer */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="py-12 sm:py-16"
      >
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-12 sm:mb-16">
            {/* Brand */}
            <motion.div variants={itemVariants}>
              <Link href="/" className="font-heading text-2xl text-gold mb-4 block">
                BijNoor
              </Link>
              <p className="text-white/60 text-sm mb-6">
                Premium natural beauty products crafted with intention for transformation.
              </p>
              <div className="flex gap-4">
                <a
                  href="#"
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-gold text-white hover:text-dark-text transition-all duration-300"
                >
                  <Facebook size={18} />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-gold text-white hover:text-dark-text transition-all duration-300"
                >
                  <Instagram size={18} />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-gold text-white hover:text-dark-text transition-all duration-300"
                >
                  <Twitter size={18} />
                </a>
              </div>
            </motion.div>

            {/* Links */}
            {Object.entries(footerLinks).map(([category, links]) => (
              <motion.div key={category} variants={itemVariants}>
                <h4 className="font-heading text-lg mb-4">{category}</h4>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-white/60 hover:text-gold transition-colors duration-300"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}

            {/* Contact */}
            <motion.div variants={itemVariants}>
              <h4 className="font-heading text-lg mb-4">Contact</h4>
              <ul className="space-y-4">
                <li className="flex gap-3 text-white/60 hover:text-gold transition-colors duration-300">
                  <Mail size={18} className="flex-shrink-0 mt-1" />
                  <a href="mailto:hello@bijnoor.com">hello@bijnoor.com</a>
                </li>
                <li className="flex gap-3 text-white/60 hover:text-gold transition-colors duration-300">
                  <Phone size={18} className="flex-shrink-0 mt-1" />
                  <a href="tel:+919876543210">+91 98765 43210</a>
                </li>
                <li className="flex gap-3 text-white/60">
                  <MapPin size={18} className="flex-shrink-0 mt-1" />
                  <span>Mumbai, India</span>
                </li>
              </ul>
            </motion.div>
          </div>

          {/* Bottom Bar */}
          <motion.div
            variants={itemVariants}
            className="border-t border-white/10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-white/60 text-sm"
          >
            <p>&copy; 2024 BijNoor. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/privacy-policy" className="hover:text-gold transition-colors duration-300">
                Privacy Policy
              </Link>
              <Link href="/terms-of-service" className="hover:text-gold transition-colors duration-300">
                Terms of Service
              </Link>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </footer>
  );
}
