"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Product } from "@/types";
import { useCart } from "@/context/CartContext";
import { ShoppingCart, Star } from "lucide-react";
import Link from "next/link";
import { slugify } from "@/lib/slug";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const productPath = `/product/${product.slug || slugify(product.name)}`;
  const isLaunchingSoon = Boolean(product.launchSoon);
  const isPurchasable = product.stock > 0 && !isLaunchingSoon;

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      whileHover={{ y: -6, boxShadow: "0 20px 25px -5px rgba(201,169,97,0.18)" }}
      className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col"
    >
      {/* Image Container — square on mobile, fills naturally */}
      <div className="relative overflow-hidden bg-beige aspect-square">
        <motion.img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover"
          whileHover={{ scale: 1.06 }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        <h3 className="font-heading text-base sm:text-lg text-dark-text mb-1 line-clamp-2 leading-snug">
          <Link href={productPath} className="hover:text-gold transition-colors">
            {product.name}
          </Link>
        </h3>

        <p className="text-xs sm:text-sm text-light-text mb-3 line-clamp-2">
          {product.description}
        </p>

        {/* Rating */}
        <div className="flex items-center gap-1.5 mb-3">
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={14} className="fill-gold text-gold" />
            ))}
          </div>
          <span className="text-xs text-light-text">(248)</span>
        </div>

        {/* Ingredients */}
        <div className="mb-3 flex flex-wrap gap-1.5">
          {product.ingredients.slice(0, 2).map((ingredient) => (
            <span
              key={ingredient}
              className="text-xs bg-beige text-dark-text px-2 py-0.5 rounded-full"
            >
              {ingredient}
            </span>
          ))}
          {product.ingredients.length > 2 && (
            <span className="text-xs text-light-text/60 py-0.5">
              +{product.ingredients.length - 2}
            </span>
          )}
        </div>

        {/* Price */}
        <div className="mb-3">
          {isLaunchingSoon ? (
            <span className="font-heading text-lg sm:text-xl text-dark-text">Launching Soon</span>
          ) : (
            <span className="font-heading text-xl sm:text-2xl text-gold">
              ₹{product.price.toLocaleString()}
            </span>
          )}
        </div>

        {/* Quantity Selector — large touch targets for mobile */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={quantity === 1}
            aria-label="Decrease quantity"
            className="w-11 h-11 flex items-center justify-center border border-beige rounded-lg hover:bg-beige active:scale-95 disabled:opacity-40 text-lg transition-all"
          >
            −
          </button>
          <span className="flex-1 text-center text-sm font-semibold tabular-nums">
            {quantity}
          </span>
          <button
            onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
            disabled={quantity >= product.stock}
            aria-label="Increase quantity"
            className="w-11 h-11 flex items-center justify-center border border-beige rounded-lg hover:bg-beige active:scale-95 disabled:opacity-40 text-lg transition-all"
          >
            +
          </button>
        </div>

        <Link
          href={productPath}
          className="mb-3 text-sm text-gold font-semibold hover:underline"
        >
          View details
        </Link>

        {/* Add to Cart Button — mt-auto pushes it to the card bottom */}
        <motion.button
          onClick={handleAddToCart}
          disabled={!isPurchasable}
          whileTap={{ scale: 0.97 }}
          className={`mt-auto w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300 active:scale-95 ${
            isAdded
              ? "bg-green-500 text-white"
              : !isPurchasable
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-gold text-white hover:brightness-105 shadow-md shadow-gold/20"
          }`}
        >
          <ShoppingCart size={17} />
          {isAdded ? "Added!" : isLaunchingSoon ? "Launching Soon" : "Add to Cart"}
        </motion.button>
      </div>
    </motion.div>
  );
}
