import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const categoryFallbackImage = {
  religious:
    'https://res.cloudinary.com/dif6u5314/image/upload/v1790006430/dreamzdecors/products/golden-temple-handcrafted-art.jpg',
  'wall-art': '',
  'gallery-sets': '',
  bundles: '',
};

const productFallbackImages = [];

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

// Absolute, human-readable timestamp — e.g. "7 Jun 2026, 3:42 PM" (IST locale).
// Used for notifications/history where the EXACT time matters, not "5m ago".
export function formatDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
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
  const image = p.images?.[0]?.url || p.image || '';
  const hover = p.images?.[1]?.url || p.hover || '';

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

export function normalizeHref(href) {
  if (!href) return '';
  if (href.startsWith('/shop/') && href !== '/shop') {
    return href.replace('/shop/', '/');
  }
  return href;
}
