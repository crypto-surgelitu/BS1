const express = require('express');
const router = express.Router();
const ReviewModel = require('../models/reviewModel');
const { authenticate } = require('../middleware/auth');

// Kept for backward compatibility with the lightweight booking-review popup.
router.post('/', authenticate, async (req, res) => {
    const { rating, label, comment, bookingId } = req.body;
    const userId = req.user.id;
    const reviewComment = comment || label;

    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    if (!reviewComment) {
        return res.status(400).json({ error: 'Review comment is required' });
    }

    try {
        const result = await ReviewModel.create(userId, bookingId || null, rating, reviewComment, {
            quickReview: true
        });

        res.status(201).json({ success: true, reviewId: result.insertId });
    } catch (err) {
        console.error('Error creating quick review:', err);
        res.status(500).json({ error: 'Failed to create review' });
    }
});

module.exports = router;
