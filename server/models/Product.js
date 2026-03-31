const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  price:    { type: Number, required: true },
  oldPrice: { type: Number, default: null },
  img:      { type: String, required: true },
  badge:    { type: String, default: null },
  rating:   { type: Number, default: 5, min: 0, max: 5 },
  reviews:  { type: Number, default: 0 },
  category: { type: String, required: true, lowercase: true, trim: true },
  description: { type: String, default: 'A premium skincare formulation designed for all skin types. Made with clean, non-toxic, cruelty-free ingredients for a healthy, radiant glow.' },
}, { timestamps: true });

// Text index for search
productSchema.index({ name: 'text', category: 'text' });

module.exports = mongoose.model('Product', productSchema);
