const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code:     { type: String, required: true, unique: true, uppercase: true, trim: true },
  discount: { type: Number, required: true, min: 0, max: 1 }, // e.g. 0.10 = 10%
  active:   { type: Boolean, default: true },
  expiresAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);
