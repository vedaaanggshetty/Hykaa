const router = require('express').Router();
const Order = require('../models/Order');
const User = require('../models/User');
const Coupon = require('../models/Coupon');
const { protect } = require('../middleware/auth');

// POST /api/orders — place order
router.post('/', protect, async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, couponCode } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items in order' });
    }

    const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
    let discount = 0;
    let couponUsed = null;

    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), active: true });
      if (coupon) {
        if (!coupon.expiresAt || coupon.expiresAt > new Date()) {
          discount = subtotal * coupon.discount;
          couponUsed = coupon.code;
        }
      }
    }

    const total = subtotal - discount;

    const order = await Order.create({
      user: req.user._id,
      items: items.map(i => ({
        product: i._id || i.productId,
        name: i.name,
        price: i.price,
        qty: i.qty,
        img: i.img,
      })),
      subtotal,
      discount,
      total,
      coupon: couponUsed,
      shippingAddress,
      paymentMethod: paymentMethod || 'cod',
    });

    // Clear user's cart after order
    const user = await User.findById(req.user._id);
    user.cart = [];
    await user.save();

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/orders — order history
router.get('/', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/orders/:id — single order
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
