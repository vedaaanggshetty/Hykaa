const router = require('express').Router();
const mongoose = require('mongoose');

// Simple newsletter subscriber schema (inline)
const subscriberSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
}, { timestamps: true });

const Subscriber = mongoose.model('Subscriber', subscriberSchema);

// POST /api/newsletter — subscribe
router.post('/', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const exists = await Subscriber.findOne({ email });
    if (exists) return res.json({ message: 'You are already subscribed!' });

    await Subscriber.create({ email });
    res.status(201).json({ message: 'Thank you for subscribing! 🎉' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
