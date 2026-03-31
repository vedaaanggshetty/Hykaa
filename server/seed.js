require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');
const Coupon = require('./models/Coupon');

const products = [
  { name: 'Facial Cleanser',               price: 29.00, oldPrice: 39.00, img: './assets/images/product-01.jpg', badge: '-26%', rating: 5, reviews: 5170, category: 'cleanser' },
  { name: 'Bio-shroom Rejuvenating Serum', price: 29.00, oldPrice: null,  img: './assets/images/product-02.jpg', badge: null,   rating: 5, reviews: 5170, category: 'serum' },
  { name: 'Coffee Bean Caffeine Eye Cream',price: 29.00, oldPrice: null,  img: './assets/images/product-03.jpg', badge: null,   rating: 5, reviews: 5170, category: 'cream' },
  { name: 'Facial Cleanser Pro',           price: 29.00, oldPrice: null,  img: './assets/images/product-04.jpg', badge: null,   rating: 5, reviews: 5170, category: 'cleanser' },
  { name: 'Coffee Bean Eye Cream',         price: 29.00, oldPrice: 39.00, img: './assets/images/product-05.jpg', badge: '-26%', rating: 5, reviews: 5170, category: 'cream' },
  { name: 'Facial Cleanser Lite',          price: 29.00, oldPrice: null,  img: './assets/images/product-06.jpg', badge: null,   rating: 5, reviews: 5170, category: 'cleanser' },
  { name: 'Vitamin C Bright Serum',        price: 19.00, oldPrice: 29.00, img: './assets/images/product-07.jpg', badge: '-34%', rating: 5, reviews: 5170, category: 'serum' },
  { name: 'Bio-shroom Renew Serum',        price: 19.00, oldPrice: null,  img: './assets/images/product-08.jpg', badge: null,   rating: 5, reviews: 5170, category: 'serum' },
  { name: 'Rose Glow Moisturizer',         price: 22.00, oldPrice: null,  img: './assets/images/product-09.jpg', badge: null,   rating: 5, reviews: 3200, category: 'moisturizer' },
  { name: 'Night Repair Cream',            price: 24.00, oldPrice: null,  img: './assets/images/product-10.jpg', badge: null,   rating: 5, reviews: 2800, category: 'cream' },
  { name: 'Hydra-Boost Toner',             price: 18.00, oldPrice: null,  img: './assets/images/product-11.jpg', badge: null,   rating: 5, reviews: 1900, category: 'toner' },
  { name: 'Soothing Aloe Gel',             price: 15.00, oldPrice: null,  img: './assets/images/product-15.jpg', badge: null,   rating: 5, reviews: 1500, category: 'gel' },
  { name: 'SPF 50 Sunscreen',              price: 21.00, oldPrice: null,  img: './assets/images/product-16.jpg', badge: null,   rating: 5, reviews: 4100, category: 'sunscreen' },
  { name: 'Exfoliating Scrub',             price: 17.00, oldPrice: 22.00, img: './assets/images/product-17.jpg', badge: '-22%', rating: 5, reviews: 2300, category: 'scrub' },
];

const coupons = [
  { code: 'HYKAA10',    discount: 0.10, active: true },
  { code: 'SKINCARE20', discount: 0.20, active: true },
  { code: 'WELCOME15',  discount: 0.15, active: true },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Product.deleteMany({});
    await Coupon.deleteMany({});
    console.log('Cleared existing products and coupons');

    // Insert products
    const inserted = await Product.insertMany(products);
    console.log(`✅ Seeded ${inserted.length} products`);

    // Insert coupons
    const insertedCoupons = await Coupon.insertMany(coupons);
    console.log(`✅ Seeded ${insertedCoupons.length} coupons`);

    // Print product IDs for reference
    console.log('\nProduct ID mapping:');
    inserted.forEach(p => console.log(`  ${p.name}: ${p._id}`));

    await mongoose.disconnect();
    console.log('\nDone! Database seeded successfully.');
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  }
}

seed();
