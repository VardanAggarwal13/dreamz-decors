import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Category from "../models/Category.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Review from "../models/Review.js";

const categories = [
  {
    title: "Wall Art",
    slug: "wall-art",
    blurb: "Hand-curated canvases for living rooms, bedrooms and studios.",
    image: {
      url: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=1200&auto=format&fit=crop&q=70",
    },
    order: 1,
  },
  {
    title: "Gallery Sets",
    slug: "gallery-sets",
    blurb: "Curated pairings and triptychs for a more finished wall.",
    image: {
      url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&auto=format&fit=crop&q=70",
    },
    order: 2,
  },
  {
    title: "Skate Decks",
    slug: "skateboards",
    blurb: "Limited-run art decks. Mount them. Ride them. Up to you.",
    image: {
      url: "https://images.unsplash.com/photo-1520975922323-a59c2deb1cc1?w=1200&auto=format&fit=crop&q=70",
    },
    order: 3,
  },
  {
    title: "Bundles",
    slug: "bundles",
    blurb: "Best-value sets for gifting and quick room refreshes.",
    image: {
      url: "https://images.unsplash.com/photo-1494526585095-c41746248156?w=1200&auto=format&fit=crop&q=70",
    },
    order: 4,
  },
];

const wallArtPricing = [
  {
    size: "18x24",
    withoutFrame: 1600,
    blackWhiteFrame: 2800,
    antiqueFrame: 3000,
    stretchedFrame: 2800,
  },
  {
    size: "20x30",
    withoutFrame: 2600,
    blackWhiteFrame: 4700,
    antiqueFrame: 4900,
    stretchedFrame: 4700,
  },
  {
    size: "24x36",
    withoutFrame: 3000,
    blackWhiteFrame: 4900,
    antiqueFrame: 5100,
    stretchedFrame: 4900,
  },
  {
    size: "30x40",
    withoutFrame: 4000,
    blackWhiteFrame: 7600,
    antiqueFrame: 7800,
    stretchedFrame: 7600,
  },
  {
    size: "30x48",
    withoutFrame: 4600,
    blackWhiteFrame: 8100,
    antiqueFrame: 8300,
    stretchedFrame: 8100,
  },
  {
    size: "36x48",
    withoutFrame: 5400,
    blackWhiteFrame: 10000,
    antiqueFrame: 10800,
    stretchedFrame: 10200,
  },
  {
    size: "48x60",
    withoutFrame: 8500,
    blackWhiteFrame: null,
    antiqueFrame: 19100,
    stretchedFrame: 15900,
  },
  {
    size: "60x36",
    withoutFrame: 7200,
    blackWhiteFrame: null,
    antiqueFrame: 16100,
    stretchedFrame: 13800,
  },
  {
    size: "72x36",
    withoutFrame: 7800,
    blackWhiteFrame: null,
    antiqueFrame: null,
    stretchedFrame: null,
  },
  {
    size: "72x48",
    withoutFrame: 10200,
    blackWhiteFrame: null,
    antiqueFrame: null,
    stretchedFrame: null,
  },
  {
    size: "84x48",
    withoutFrame: 12000,
    blackWhiteFrame: null,
    antiqueFrame: null,
    stretchedFrame: null,
  },
  {
    size: "96x48",
    withoutFrame: 14000,
    blackWhiteFrame: null,
    antiqueFrame: null,
    stretchedFrame: null,
  },
  {
    size: "96x60",
    withoutFrame: 16800,
    blackWhiteFrame: null,
    antiqueFrame: null,
    stretchedFrame: null,
  },
  {
    size: "108x60",
    withoutFrame: 19100,
    blackWhiteFrame: null,
    antiqueFrame: null,
    stretchedFrame: null,
  },
];

const wallArtFrames = [
  { key: "withoutFrame", label: "Without Frame", sku: "WF" },
  { key: "blackWhiteFrame", label: "Black / White Frame", sku: "BWF" },
  { key: "antiqueFrame", label: "Antique Frame", sku: "AF" },
  { key: "stretchedFrame", label: "Stretched Frame", sku: "SF" },
];

const createWallArtVariants = (productSlug) =>
  wallArtPricing.flatMap((priceRow) =>
    wallArtFrames
      .filter((frame) => priceRow[frame.key] != null)
      .map((frame) => ({
        sku: `${productSlug}-${priceRow.size}-${frame.sku}`.toUpperCase(),
        size: priceRow.size,
        frame: frame.label,
        price: priceRow[frame.key],
        stock: 50,
      })),
  );

const wallArtBasePrice = Math.min(
  ...wallArtPricing.flatMap((priceRow) =>
    wallArtFrames
      .map((frame) => priceRow[frame.key])
      .filter((price) => price != null),
  ),
);

const productsByCategory = {
  "wall-art": [
    {
      title: "Midnight Bloom Canvas",
      badge: null,
      tags: ["bedroom", "abstract", "portrait"],
      description:
        "An abstract dark bloom on premium artist canvas — deep, moody tones with gold detailing.",
      images: [
        {
          url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=900&auto=format&fit=crop&q=80",
          alt: "Midnight Bloom Canvas",
        },
        {
          url: "https://images.unsplash.com/photo-1494526585095-c41746248156?w=900&auto=format&fit=crop&q=80",
          alt: "Midnight Bloom Canvas — styled",
        },
      ],
    },
    {
      title: "Golden Serenity Canvas",
      badge: null,
      tags: ["living-room", "abstract", "gold"],
      description:
        "Warm gold tones and fluid abstract forms — designed for living rooms that should feel finished.",
      images: [
        {
          url: "https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?w=900&auto=format&fit=crop&q=80",
          alt: "Golden Serenity Canvas",
        },
        {
          url: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=900&auto=format&fit=crop&q=80",
          alt: "Golden Serenity Canvas — room view",
        },
      ],
    },
    {
      title: "Horizon Drift Canvas",
      badge: null,
      tags: ["living-room", "nature", "landscape"],
      description:
        "A calming landscape in muted earthy tones — quiet, premium, ready to anchor any wall.",
      images: [
        {
          url: "https://images.unsplash.com/photo-1494526585095-c41746248156?w=900&auto=format&fit=crop&q=80",
          alt: "Horizon Drift Canvas",
        },
        {
          url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=900&auto=format&fit=crop&q=80",
          alt: "Horizon Drift Canvas — room view",
        },
      ],
    },
    {
      title: "Ocean Stillness Canvas",
      badge: null,
      tags: ["bedroom", "nature", "blue"],
      description:
        "Cool blues and soft whites in a serene seascape — calm, understated, and enduringly elegant.",
      images: [
        {
          url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900&auto=format&fit=crop&q=80",
          alt: "Ocean Stillness Canvas",
        },
        {
          url: "https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?w=900&auto=format&fit=crop&q=80",
          alt: "Ocean Stillness Canvas — room view",
        },
      ],
    },
    {
      title: "Ember Glow Canvas",
      badge: null,
      tags: ["dining", "abstract", "warm"],
      description:
        "Amber and rust gradients that bring warmth to dining rooms and hallways alike.",
      images: [
        {
          url: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=900&auto=format&fit=crop&q=80",
          alt: "Ember Glow Canvas",
        },
        {
          url: "https://images.unsplash.com/photo-1494526585095-c41746248156?w=900&auto=format&fit=crop&q=80",
          alt: "Ember Glow Canvas — room view",
        },
      ],
    },
  ],
  "gallery-sets": [
    {
      title: "Studio Harmony Set",
      price: 4999,
      mrp: 5999,
      badge: "NEW",
      tags: ["gallery", "abstract", "bedroom"],
      description:
        "A curated pair of abstract pieces designed to work together effortlessly on any feature wall.",
      images: [
        {
          url: "https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?w=900&auto=format&fit=crop&q=80",
          alt: "Studio Harmony Set",
        },
        {
          url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=900&auto=format&fit=crop&q=80",
          alt: "Studio Harmony Set — room view",
        },
      ],
    },
    {
      title: "Soft Horizon Gallery Set",
      price: 3899,
      mrp: 4499,
      badge: "BEST",
      tags: ["gallery", "nature", "living-room"],
      description:
        "Three nature-inspired prints in a unified soft palette — ready to hang together from day one.",
      images: [
        {
          url: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=900&auto=format&fit=crop&q=80",
          alt: "Soft Horizon Gallery Set",
        },
        {
          url: "https://images.unsplash.com/photo-1494526585095-c41746248156?w=900&auto=format&fit=crop&q=80",
          alt: "Soft Horizon Gallery Set — room view",
        },
      ],
    },
    {
      title: "Monochrome Edit Set",
      price: 4499,
      mrp: 5499,
      badge: "NEW",
      tags: ["gallery", "office", "minimal"],
      description:
        "Bold compositions that bring editorial precision to offices and studies.",
      images: [
        {
          url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=900&auto=format&fit=crop&q=80",
          alt: "Monochrome Edit Set",
        },
        {
          url: "https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?w=900&auto=format&fit=crop&q=80",
          alt: "Monochrome Edit Set — room view",
        },
      ],
    },
  ],
  skateboards: [
    {
      title: "Pop Burst Skate Deck",
      price: 3499,
      mrp: 3999,
      badge: "LTD",
      tags: ["art-deck", "limited-edition"],
      description:
        "A limited-run art deck with hand-finished colour work. Mount it as wall art or ride it.",
      images: [
        {
          url: "https://images.unsplash.com/photo-1520975922323-a59c2deb1cc1?w=900&auto=format&fit=crop&q=80",
          alt: "Pop Burst Skate Deck",
        },
        {
          url: "https://images.unsplash.com/photo-1520975922323-a59c2deb1cc1?w=900&auto=format&fit=crop&q=80",
          alt: "Pop Burst Skate Deck — detail",
        },
      ],
    },
    {
      title: "Neon Streak Deck",
      price: 3799,
      mrp: 4299,
      badge: "LTD",
      tags: ["art-deck", "limited-edition", "neon"],
      description:
        "Vibrant neon strokes on a premium maple deck — a collector piece for any wall.",
      images: [
        {
          url: "https://images.unsplash.com/photo-1520975922323-a59c2deb1cc1?w=900&auto=format&fit=crop&q=80",
          alt: "Neon Streak Deck",
        },
        {
          url: "https://images.unsplash.com/photo-1520975922323-a59c2deb1cc1?w=900&auto=format&fit=crop&q=80",
          alt: "Neon Streak Deck — detail",
        },
      ],
    },
  ],
  bundles: [
    {
      title: "Collector Wall Bundle",
      price: 5499,
      mrp: 6999,
      badge: "BEST",
      tags: ["bundle", "living-room", "gift"],
      description:
        "Our most-loved starter set — three complementary prints for an instant gallery-wall look.",
      images: [
        {
          url: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=900&auto=format&fit=crop&q=80",
          alt: "Collector Wall Bundle",
        },
        {
          url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=900&auto=format&fit=crop&q=80",
          alt: "Collector Wall Bundle — room view",
        },
      ],
    },
    {
      title: "Signature Pair Bundle",
      price: 4299,
      mrp: 4999,
      badge: "NEW",
      tags: ["bundle", "bedroom", "office"],
      description:
        "Two statement canvases in a matched edition — curated for bedrooms and home offices.",
      images: [
        {
          url: "https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?w=900&auto=format&fit=crop&q=80",
          alt: "Signature Pair Bundle",
        },
        {
          url: "https://images.unsplash.com/photo-1494526585095-c41746248156?w=900&auto=format&fit=crop&q=80",
          alt: "Signature Pair Bundle — room view",
        },
      ],
    },
    {
      title: "Gold Foil Gift Bundle",
      price: 6999,
      mrp: 8499,
      badge: "BEST",
      tags: ["bundle", "gift", "gold", "living-room"],
      description:
        "Premium gold foil canvases gifted-boxed and ready to impress — our top gifting pick.",
      images: [
        {
          url: "https://images.unsplash.com/photo-1494526585095-c41746248156?w=900&auto=format&fit=crop&q=80",
          alt: "Gold Foil Gift Bundle",
        },
        {
          url: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=900&auto=format&fit=crop&q=80",
          alt: "Gold Foil Gift Bundle — room view",
        },
      ],
    },
  ],
};

const slugify = (s) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-");

const reviews = [
  {
    author: "Priya S.",
    role: "Living room refresh",
    quote:
      "The gold foil finish feels far more premium than the price suggests. It completely changed the look of my drawing room.",
    rating: 5,
    order: 1,
  },
  {
    author: "Rahul K.",
    role: "Repeat buyer",
    quote:
      "Packaging was incredibly secure — bubble wrap, foam corners, the works. Arrived looking gallery-ready on the first try.",
    rating: 5,
    order: 2,
  },
  {
    author: "Ananya M.",
    role: "Interior designer, Pune",
    quote:
      "I recommend Dreamz Decor to clients who want a premium wall story without a luxury price tag. The quality is genuinely impressive.",
    rating: 5,
    order: 3,
  },
  {
    author: "Vikram T.",
    role: "Home office upgrade",
    quote:
      "Ordered the abstract canvas for my study. The colours are rich and the frame is solid. Delivery was faster than expected too.",
    rating: 5,
    order: 4,
  },
  {
    author: "Sneha R.",
    role: "Bedroom styling",
    quote:
      "Finally found an art brand that actually ships properly. No damage, no dents — and the piece itself is absolutely beautiful.",
    rating: 5,
    order: 5,
  },
  {
    author: "Arjun N.",
    role: "Hotel owner, Jaipur",
    quote:
      "We ordered 12 pieces for our boutique hotel lobby. Every single one arrived in perfect condition. Our guests always ask about them.",
    rating: 5,
    order: 6,
  },
  {
    author: "Deepika L.",
    role: "Gifted to parents",
    quote:
      "Gifted the gold foil Ganesha piece to my parents for their anniversary. My mother cried. Worth every rupee and more.",
    rating: 5,
    order: 7,
  },
  {
    author: "Rohan V.",
    role: "New apartment styling",
    quote:
      "As someone who just moved into their first home, this was the easiest way to make the walls feel intentional and put-together.",
    rating: 5,
    order: 8,
  },
];

const run = async () => {
  await connectDB();
  console.log("Clearing existing catalog...");
  await Category.deleteMany({});
  await Product.deleteMany({});
  await Review.deleteMany({});

  const catDocs = await Category.insertMany(categories);
  const catBySlug = Object.fromEntries(catDocs.map((c) => [c.slug, c]));

  const products = [];
  for (const [slug, list] of Object.entries(productsByCategory)) {
    for (const p of list) {
      const productSlug = slugify(p.title);
      const variants =
        slug === "wall-art" ? createWallArtVariants(productSlug) : [];
      products.push({
        ...p,
        slug: productSlug,
        category: catBySlug[slug]._id,
        price: slug === "wall-art" ? wallArtBasePrice : p.price,
        mrp: slug === "wall-art" ? undefined : p.mrp,
        variants,
        description:
          p.description ||
          "Premium giclée print on artist-grade canvas. Sustainably packaged. Ships in 7–10 days from our studio.",
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
  console.log(
    `Seeded ${catDocs.length} categories and ${products.length} products.`,
  );

  const adminEmail = "vardanaggarwal13@gmail.com";
  const exists = await User.findOne({ email: adminEmail });
  if (!exists) {
    await User.create({
      name: "DreamzDecors Admin",
      email: adminEmail,
      password: "Vardan@123",
      role: "admin",
    });
    console.log(`Created admin: ${adminEmail} / admin12345`);
  } else {
    console.log(`Admin already exists: ${adminEmail}`);
  }

  await Review.insertMany(reviews);
  console.log(`Seeded ${reviews.length} reviews.`);

  await mongoose.disconnect();
  console.log("Seed complete.");
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
