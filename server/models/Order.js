const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name:    String,
    price:   Number,
    qty:     Number,
    img:     String,
  }],
  subtotal:  { type: Number, required: true },
  discount:  { type: Number, default: 0 },
  total:     { type: Number, required: true },
  coupon:    { type: String, default: null },
  status:    { type: String, enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
  shippingAddress: {
    fullName: String,
    address:  String,
    city:     String,
    zip:      String,
    phone:    String,
  },
  paymentMethod: { type: String, enum: ['card', 'cod'], default: 'cod' },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
