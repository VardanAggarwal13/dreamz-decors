// Placeholder catalog used by the storefront until the backend is seeded.
// Replace with API data via `/api/products` once the backend is live.
export const categories = [
  {
    slug: 'wall-art',
    title: 'Wall Art',
    blurb: 'Hand-curated canvases for living rooms, bedrooms and studios.',
    image:
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=1200&auto=format&fit=crop&q=70',
  },
  {
    slug: 'neon-signs',
    title: 'Neon Signs',
    blurb: 'Custom neons, pre-designed quotes and statement glows.',
    image:
      'https://images.unsplash.com/photo-1567608198063-489b890ab8a4?w=1200&auto=format&fit=crop&q=70',
  },
  {
    slug: 'skateboards',
    title: 'Skate Decks',
    blurb: 'Limited-run art decks. Mount them. Ride them. Up to you.',
    image:
      'https://images.unsplash.com/photo-1520975922323-a59c2deb1cc1?w=1200&auto=format&fit=crop&q=70',
  },
  {
    slug: 'custom',
    title: 'Custom',
    blurb: 'Send a reference, our designers draft, you approve, we ship.',
    image:
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=1200&auto=format&fit=crop&q=70',
  },
];

export const products = [
  {
    id: 'p1',
    slug: 'midnight-bloom-canvas',
    title: 'Midnight Bloom Canvas',
    category: 'wall-art',
    price: 1499,
    mrp: 1799,
    image:
      'https://images.unsplash.com/photo-1549490349-8643362247b5?w=900&auto=format&fit=crop&q=70',
    hover:
      'https://images.unsplash.com/photo-1582738411706-bfc8e691d1c2?w=900&auto=format&fit=crop&q=70',
    badge: '-17%',
    rating: 4.8,
    reviews: 142,
  },
  {
    id: 'p2',
    slug: 'dream-bigger-neon',
    title: 'Dream Bigger Neon',
    category: 'neon-signs',
    price: 4999,
    mrp: 5999,
    image:
      'https://images.unsplash.com/photo-1574169208507-84376144848b?w=900&auto=format&fit=crop&q=70',
    hover:
      'https://images.unsplash.com/photo-1567609322116-7642b08b3e4f?w=900&auto=format&fit=crop&q=70',
    badge: 'NEW',
    rating: 4.9,
    reviews: 88,
  },
  {
    id: 'p3',
    slug: 'mountains-mood-triptych',
    title: 'Mountains Mood Triptych',
    category: 'wall-art',
    price: 2799,
    mrp: 3499,
    image:
      'https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?w=900&auto=format&fit=crop&q=70',
    hover:
      'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=900&auto=format&fit=crop&q=70',
    badge: '-20%',
    rating: 4.7,
    reviews: 213,
  },
  {
    id: 'p4',
    slug: 'pop-burst-deck',
    title: 'Pop Burst Skate Deck',
    category: 'skateboards',
    price: 3499,
    mrp: 3999,
    image:
      'https://images.unsplash.com/photo-1520975661595-6453be3f7070?w=900&auto=format&fit=crop&q=70',
    hover:
      'https://images.unsplash.com/photo-1520975954732-35dd22299614?w=900&auto=format&fit=crop&q=70',
    badge: 'LTD',
    rating: 4.6,
    reviews: 41,
  },
  {
    id: 'p5',
    slug: 'good-vibes-neon',
    title: 'Good Vibes Neon',
    category: 'neon-signs',
    price: 3899,
    mrp: 4499,
    image:
      'https://images.unsplash.com/photo-1571513800374-df1bbe650e56?w=900&auto=format&fit=crop&q=70',
    hover:
      'https://images.unsplash.com/photo-1599689018034-48e2ead82951?w=900&auto=format&fit=crop&q=70',
    badge: 'BEST',
    rating: 4.9,
    reviews: 305,
  },
  {
    id: 'p6',
    slug: 'sunset-haze-canvas',
    title: 'Sunset Haze Canvas',
    category: 'wall-art',
    price: 1299,
    mrp: 1599,
    image:
      'https://images.unsplash.com/photo-1505761671935-60b3a7427bad?w=900&auto=format&fit=crop&q=70',
    hover:
      'https://images.unsplash.com/photo-1504198266287-1659872e6590?w=900&auto=format&fit=crop&q=70',
    badge: '-19%',
    rating: 4.8,
    reviews: 167,
  },
  {
    id: 'p7',
    slug: 'ocean-stillness-canvas',
    title: 'Ocean Stillness Canvas',
    category: 'wall-art',
    price: 1599,
    mrp: 1899,
    image:
      'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=900&auto=format&fit=crop&q=70',
    hover:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900&auto=format&fit=crop&q=70',
    badge: 'NEW',
    rating: 4.7,
    reviews: 73,
  },
  {
    id: 'p8',
    slug: 'love-yourself-neon',
    title: 'Love Yourself Neon',
    category: 'neon-signs',
    price: 4299,
    mrp: 4999,
    image:
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=900&auto=format&fit=crop&q=70',
    hover:
      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=900&auto=format&fit=crop&q=70',
    badge: '-14%',
    rating: 4.9,
    reviews: 198,
  },
];

export const trustStrip = [
  '15,000+ Homes Styled',
  '4.9 / 5 from 4,200 Reviews',
  'Free Shipping over ₹1,499',
  'Easy 7-day returns',
  'Made in India · Shipped Worldwide',
];

export const navMenu = [
  {
    label: 'Wall Art',
    href: '/shop/wall-art',
    groups: [
      { title: 'By Room', items: ['Living Room', 'Bedroom', 'Office', 'Kids Room', 'Cafe / Restaurant'] },
      { title: 'By Theme', items: ['Abstract', 'Nature', 'Travel', 'Music', 'Movies', 'Quotes'] },
      { title: 'By Layout', items: ['Single Panel', 'Triptych', 'Square', 'Round', 'Portrait', 'Landscape'] },
    ],
  },
  {
    label: 'Neon Signs',
    href: '/shop/neon-signs',
    groups: [
      { title: 'Popular', items: ['Quotes', 'Names', 'Logos', 'Animals', 'Symbols'] },
      { title: 'For Spaces', items: ['Bedroom', 'Cafe', 'Salon', 'Studio', 'Wedding'] },
      { title: 'By Color', items: ['Pink', 'Cool White', 'Warm White', 'Ice Blue', 'Lime', 'Multi'] },
    ],
  },
  {
    label: 'Skateboards',
    href: '/shop/skateboards',
    groups: [
      { title: 'Decks', items: ['Art Decks', 'Limited Edition', 'Pro Series'] },
      { title: 'Display', items: ['Wall Mount', 'Stand'] },
    ],
  },
  { label: 'Custom', href: '/shop/custom' },
  { label: 'Bundles', href: '/shop?filter=bundles' },
];
