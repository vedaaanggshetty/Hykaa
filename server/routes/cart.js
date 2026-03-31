const router = require('express').Router();
const User = require('../models/User');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

// GET /api/cart — get user's cart
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('cart.product');
    const items = user.cart
      .filter(item => item.product) // filter out any deleted products
      .map(item => ({
        _id: item.product._id,
        name: item.product.name,
        price: item.product.price,
        oldPrice: item.product.oldPrice,
        img: item.product.img,
        badge: item.product.badge,
        category: item.product.category,
        qty: item.qty,
      }));
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/cart — add item to cart { productId, qty }
router.post('/', protect, async (req, res) => {
  try {
    const { productId, qty = 1 } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const user = await User.findById(req.user._id);
    const existing = user.cart.find(item => item.product.toString() === productId);

    if (existing) {
      existing.qty += qty;
    } else {
      user.cart.push({ product: productId, qty });
    }
    await user.save();

    // Return populated cart
    const updated = await User.findById(req.user._id).populate('cart.product');
    res.json(updated.cart.filter(i => i.product).map(i => ({
      _id: i.product._id, name: i.product.name, price: i.product.price,
      oldPrice: i.product.oldPrice, img: i.product.img, badge: i.product.badge,
      category: i.product.category, qty: i.qty,
    })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/cart/:productId — update qty { qty }
router.put('/:productId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const item = user.cart.find(i => i.product.toString() === req.params.productId);
    if (!item) return res.status(404).json({ message: 'Item not in cart' });

    if (req.body.qty <= 0) {
      user.cart = user.cart.filter(i => i.product.toString() !== req.params.productId);
    } else {
      item.qty = req.body.qty;
    }
    await user.save();
    res.json({ message: 'Cart updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/cart/:productId — remove from cart
router.delete('/:productId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.cart = user.cart.filter(i => i.product.toString() !== req.params.productId);
    await user.save();
    res.json({ message: 'Removed from cart' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
