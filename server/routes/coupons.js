const router = require('express').Router();
const Coupon = require('../models/Coupon');

// POST /api/coupons/validate — validate a coupon code
router.post('/validate', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: 'Please provide a coupon code' });

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), active: true });
    if (!coupon) return res.status(404).json({ message: 'Invalid promo code' });

    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return res.status(400).json({ message: 'This coupon has expired' });
    }

    res.json({
      code: coupon.code,
      discount: coupon.discount,
      percentOff: Math.round(coupon.discount * 100),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
