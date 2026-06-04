import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

const categories = [
  {
    title: 'Wall Art',
    slug: 'wall-art',
    blurb: 'Hand-curated canvases for living rooms, bedrooms and studios.',
    image: {
      url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=1200&auto=format&fit=crop&q=70',
    },
    order: 1,
  },
  {
    title: 'Neon Signs',
    slug: 'neon-signs',
    blurb: 'Custom neons, pre-designed quotes and statement glows.',
    image: {
      url: 'https://images.unsplash.com/photo-1567608198063-489b890ab8a4?w=1200&auto=format&fit=crop&q=70',
    },
    order: 2,
  },
  {
    title: 'Skate Decks',
    slug: 'skateboards',
    blurb: 'Limited-run art decks. Mount them. Ride them. Up to you.',
    image: {
      url: 'https://images.unsplash.com/photo-1520975922323-a59c2deb1cc1?w=1200&auto=format&fit=crop&q=70',
    },
    order: 3,
  },
  {
    title: 'Custom',
    slug: 'custom',
    blurb: 'Send a reference, our designers draft, you approve, we ship.',
    image: {
      url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=1200&auto=format&fit=crop&q=70',
    },
    order: 4,
  },
];

const productsByCategory = {
  'wall-art': [
    {
      title: 'Midnight Bloom Canvas',
      price: 1499,
      mrp: 1799,
      badge: '-17%',
      tags: ['bedroom', 'abstract', 'portrait'],
      images: [
        {
          url: 'https://images.unsplash.com/photo-1549490349-8643362247b5?w=900&auto=format&fit=crop&q=70',
          alt: 'Midnight Bloom Canvas — front view',
        },
        {
          url: 'https://images.unsplash.com/photo-1582738411706-bfc8e691d1c2?w=900&auto=format&fit=crop&q=70',
          alt: 'Midnight Bloom Canvas — lifestyle',
        },
      ],
    },
    {
      title: 'Mountains Mood Triptych',
      price: 2799,
      mrp: 3499,
      badge: '-20%',
      tags: ['living-room', 'nature', 'triptych'],
      images: [
        { url: 'https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?w=900&auto=format&fit=crop&q=70' },
        { url: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=900&auto=format&fit=crop&q=70' },
      ],
    },
    {
      title: 'Sunset Haze Canvas',
      price: 1299,
      mrp: 1599,
      badge: '-19%',
      tags: ['living-room', 'abstract'],
      images: [
        { url: 'https://images.unsplash.com/photo-1505761671935-60b3a7427bad?w=900&auto=format&fit=crop&q=70' },
        { url: 'https://images.unsplash.com/photo-1504198266287-1659872e6590?w=900&auto=format&fit=crop&q=70' },
      ],
    },
    {
      title: 'Ocean Stillness Canvas',
      price: 1599,
      mrp: 1899,
      badge: 'NEW',
      tags: ['bedroom', 'nature', 'landscape'],
      images: [
        { url: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=900&auto=format&fit=crop&q=70' },
        { url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900&auto=format&fit=crop&q=70' },
      ],
    },
  ],
  'neon-signs': [
    {
      title: 'Dream Bigger Neon',
      price: 4999,
      mrp: 5999,
      badge: 'NEW',
      tags: ['quotes', 'pink', 'bedroom'],
      images: [
        { url: 'https://images.unsplash.com/photo-1574169208507-84376144848b?w=900&auto=format&fit=crop&q=70' },
        { url: 'https://images.unsplash.com/photo-1567609322116-7642b08b3e4f?w=900&auto=format&fit=crop&q=70' },
      ],
    },
    {
      title: 'Good Vibes Neon',
      price: 3899,
      mrp: 4499,
      badge: 'BEST',
      tags: ['quotes', 'warm-white', 'cafe'],
      images: [
        { url: 'https://images.unsplash.com/photo-1571513800374-df1bbe650e56?w=900&auto=format&fit=crop&q=70' },
        { url: 'https://images.unsplash.com/photo-1599689018034-48e2ead82951?w=900&auto=format&fit=crop&q=70' },
      ],
    },
    {
      title: 'Love Yourself Neon',
      price: 4299,
      mrp: 4999,
      badge: '-14%',
      tags: ['quotes', 'pink', 'studio'],
      images: [
        { url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=900&auto=format&fit=crop&q=70' },
        { url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=900&auto=format&fit=crop&q=70' },
      ],
    },
  ],
  skateboards: [
    {
      title: 'Pop Burst Skate Deck',
      price: 3499,
      mrp: 3999,
      badge: 'LTD',
      tags: ['art-deck', 'limited-edition'],
      images: [
        { url: 'https://images.unsplash.com/photo-1520975661595-6453be3f7070?w=900&auto=format&fit=crop&q=70' },
        { url: 'https://images.unsplash.com/photo-1520975954732-35dd22299614?w=900&auto=format&fit=crop&q=70' },
      ],
    },
  ],
};

const slugify = (s) =>
  s.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');

const run = async () => {
  await connectDB();
  console.log('Clearing existing catalog...');
  await Category.deleteMany({});
  await Product.deleteMany({});

  const catDocs = await Category.insertMany(categories);
  const catBySlug = Object.fromEntries(catDocs.map((c) => [c.slug, c]));

  const products = [];
  for (const [slug, list] of Object.entries(productsByCategory)) {
    for (const p of list) {
      products.push({
        ...p,
        slug: slugify(p.title),
        category: catBySlug[slug]._id,
        description:
          'Premium giclée print on artist-grade canvas. Sustainably packaged. Ships in 7–10 days from our studio.',
        rating: 4.7 + Math.random() * 0.2,
        reviewsCount: Math.floor(Math.random() * 200) + 30,
        stock: 50,
        sales: Math.floor(Math.random() * 500),
        isActive: true,
        isFeatured: true,
      });
    }
  }
  await Product.insertMany(products);
  console.log(`Seeded ${catDocs.length} categories and ${products.length} products.`);

  const adminEmail = 'admin@dreamzdecors.local';
  const exists = await User.findOne({ email: adminEmail });
  if (!exists) {
    await User.create({
      name: 'DreamzDecors Admin',
      email: adminEmail,
      password: 'admin12345',
      role: 'admin',
    });
    console.log(`Created admin: ${adminEmail} / admin12345`);
  } else {
    console.log(`Admin already exists: ${adminEmail}`);
  }

  await mongoose.disconnect();
  console.log('Seed complete.');
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
