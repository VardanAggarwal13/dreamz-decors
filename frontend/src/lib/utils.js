import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatINR(amount) {
  if (amount == null || isNaN(amount)) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function slugify(str) {
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Normalize a product coming from the API into the flat shape components expect.
// API shape: { _id, slug, title, price, mrp, images:[{url,alt}], rating, reviewsCount, badge, category:{slug}, ... }
// UI shape:  { id,  slug, title, price, mrp, image, hover, rating, reviews, badge, category }
export function normalizeProduct(p) {
  if (!p) return null;
  return {
    id: p._id || p.id,
    slug: p.slug,
    title: p.title,
    description: p.description || '',
    price: p.price,
    mrp: p.mrp,
    badge: p.badge,
    rating: p.rating ?? 4.8,
    reviews: p.reviewsCount ?? p.reviews ?? 0,
    image: p.images?.[0]?.url || p.image,
    hover: p.images?.[1]?.url || p.hover,
    images: p.images || [],
    categoryId: typeof p.category === 'object' ? p.category?._id : undefined,
    category: typeof p.category === 'string' ? p.category : p.category?.slug,
    categoryTitle: typeof p.category === 'object' ? p.category?.title : undefined,
    tags: p.tags || [],
    stock: p.stock,
  };
}

export function normalizeCategory(c) {
  if (!c) return null;
  return {
    id: c._id || c.id,
    slug: c.slug,
    title: c.title,
    blurb: c.blurb,
    image: c.image?.url || c.image,
  };
}
