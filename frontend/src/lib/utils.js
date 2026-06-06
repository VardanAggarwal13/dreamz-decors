import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const categoryFallbackImage = {
  'wall-art':
    'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=1200&auto=format&fit=crop&q=70',
  'gallery-sets':
    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&auto=format&fit=crop&q=70',
  skateboards:
    'https://images.unsplash.com/photo-1520975922323-a59c2deb1cc1?w=1200&auto=format&fit=crop&q=70',
  bundles:
    'https://images.unsplash.com/photo-1494526585095-c41746248156?w=1200&auto=format&fit=crop&q=70',
};

const productFallbackImages = [
  'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=900&auto=format&fit=crop&q=70',
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=900&auto=format&fit=crop&q=70',
  'https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?w=900&auto=format&fit=crop&q=70',
  'https://images.unsplash.com/photo-1494526585095-c41746248156?w=900&auto=format&fit=crop&q=70',
];

function fallbackByKey(key = '') {
  const normalized = String(key).trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < normalized.length; i += 1) hash = (hash << 5) - hash + normalized.charCodeAt(i);
  return productFallbackImages[Math.abs(hash) % productFallbackImages.length];
}

export function formatINR(amount) {
  if (amount == null || isNaN(amount)) return '--';
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

export function normalizeProduct(p) {
  if (!p) return null;
  const categorySlug = typeof p.category === 'string' ? p.category : p.category?.slug;
  const baseFallback = categoryFallbackImage[categorySlug] || fallbackByKey(p.slug || p.title);
  const image = p.images?.[0]?.url || p.image || baseFallback;
  const hover = p.images?.[1]?.url || p.hover || image;

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
    image,
    hover,
    images: p.images || [],
    categoryId: typeof p.category === 'object' ? p.category?._id : undefined,
    category: typeof p.category === 'string' ? p.category : p.category?.slug,
    categoryTitle: typeof p.category === 'object' ? p.category?.title : undefined,
    tags: p.tags || [],
    stock: p.stock,
    variants: p.variants || [],
  };
}

export function normalizeCategory(c) {
  if (!c) return null;
  const fallback = categoryFallbackImage[c.slug] || categoryFallbackImage['wall-art'];
  return {
    id: c._id || c.id,
    slug: c.slug,
    title: c.title,
    blurb: c.blurb,
    image: c.image?.url || c.image || fallback,
  };
}
