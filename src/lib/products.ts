import { Product } from "@/types";

export const PRODUCTS: Product[] = [
  {
    id: "1",
    name: "BijNoor Natural Hair Mask",
    price: 1499,
    description:
      "Deep nourishment hair mask with natural botanicals for smooth, healthy, and stronger hair.",
    image:
      "https://images.unsplash.com/photo-1522337094846-8a81829b8b31?w=500&h=500&fit=crop",
    category: "masks",
    ingredients: ["Amla", "Bhringraj", "Aloe Vera", "Coconut Oil"],
    benefits: ["Hair Repair", "Frizz Control", "Deep Nourishment", "Chemical Free"],
    stock: 50,
  },
  {
    id: "2",
    name: "BijNoor Herbal Scalp Revival Oil",
    price: 0,
    launchSoon: true,
    description:
      "A potent scalp nourishment blend crafted to strengthen roots and support healthier hair growth.",
    image:
      "https://images.unsplash.com/photo-1535916707207-35f97e715e1c?w=500&h=500&fit=crop",
    category: "serums",
    ingredients: ["Brahmi", "Methi", "Black Seed", "Cold-Pressed Sesame Oil"],
    benefits: ["Root Strengthening", "Scalp Balance", "Reduced Breakage", "Natural Formula"],
    stock: 0,
  },
  {
    id: "3",
    name: "BijNoor Nourish & Shine Hair Serum",
    price: 0,
    launchSoon: true,
    description:
      "A lightweight daily hair serum designed to smooth frizz, add shine, and protect strands.",
    image:
      "https://images.unsplash.com/photo-1599733594230-6b823276abcc?w=500&h=500&fit=crop",
    category: "serums",
    ingredients: ["Argan Oil", "Jojoba", "Vitamin E", "Aloe Extract"],
    benefits: ["Frizz Control", "Gloss Finish", "Heat Protection", "Lightweight Feel"],
    stock: 0,
  },
];
