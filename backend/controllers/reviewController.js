const ReviewModel = require('../models/reviewModel');

const reviewController = {
    async createReview(req, res) {
        const { bookingId, rating, comment, systemFeedback } = req.body;
        const userId = req.user.id;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Rating is required and must be between 1 and 5' });
        }

        try {
            const result = await ReviewModel.create(userId, bookingId, rating, comment, systemFeedback);
            const review = await ReviewModel.findById(result.insertId);
            res.status(201).json({ message: 'Review created successfully', data: review });
        } catch (error) {
            console.error('Error creating review:', error);
            res.status(500).json({ error: 'Failed to create review' });
        }
    },

    async getMyReviews(req, res) {
        const userId = req.user.id;

        try {
            const reviews = await ReviewModel.findByUserId(userId);
            res.json({ data: reviews });
        } catch (error) {
            console.error('Error fetching user reviews:', error);
            res.status(500).json({ error: 'Failed to fetch reviews' });
        }
    },

    async getReviewById(req, res) {
        const { id } = req.params;

        try {
            const review = await ReviewModel.findById(id);
            if (!review) {
                return res.status(404).json({ error: 'Review not found' });
            }
            res.json({ data: review });
        } catch (error) {
            console.error('Error fetching review:', error);
            res.status(500).json({ error: 'Failed to fetch review' });
        }
    },

    async updateReview(req, res) {
        const { id } = req.params;
        const userId = req.user.id;
        const { rating, comment, systemFeedback } = req.body;

        try {
            const existingReview = await ReviewModel.findById(id);
            if (!existingReview) {
                return res.status(404).json({ error: 'Review not found' });
            }

            if (existingReview.user_id !== userId) {
                return res.status(403).json({ error: 'You can only edit your own reviews' });
            }

            const result = await ReviewModel.update(id, userId, { rating, comment, systemFeedback });
            if (result.affectedRows === 0) {
                return res.status(400).json({ error: 'No changes made' });
            }

            const updatedReview = await ReviewModel.findById(id);
            res.json({ message: 'Review updated successfully', data: updatedReview });
        } catch (error) {
            console.error('Error updating review:', error);
            res.status(500).json({ error: 'Failed to update review' });
        }
    },

    async deleteReview(req, res) {
        const { id } = req.params;
        const userId = req.user.id;

        try {
            const existingReview = await ReviewModel.findById(id);
            if (!existingReview) {
                return res.status(404).json({ error: 'Review not found' });
            }

            if (existingReview.user_id !== userId) {
                return res.status(403).json({ error: 'You can only delete your own reviews' });
            }

            const result = await ReviewModel.delete(id, userId);
            if (result.affectedRows === 0) {
                return res.status(400).json({ error: 'Failed to delete review' });
            }

            res.json({ message: 'Review deleted successfully' });
        } catch (error) {
            console.error('Error deleting review:', error);
            res.status(500).json({ error: 'Failed to delete review' });
        }
    },

    async getAllReviews(req, res) {
        const { status, minRating } = req.query;

        try {
            const filters = {};
            if (status) filters.status = status;
            if (minRating) filters.minRating = parseInt(minRating);

            const reviews = await ReviewModel.findAll(filters);
            res.json({ data: reviews });
        } catch (error) {
            console.error('Error fetching all reviews:', error);
            res.status(500).json({ error: 'Failed to fetch reviews' });
        }
    },

    async hideReview(req, res) {
        const { id } = req.params;

        try {
            const existingReview = await ReviewModel.findById(id);
            if (!existingReview) {
                return res.status(404).json({ error: 'Review not found' });
            }

            await ReviewModel.hideReview(id);
            res.json({ message: 'Review hidden successfully' });
        } catch (error) {
            console.error('Error hiding review:', error);
            res.status(500).json({ error: 'Failed to hide review' });
        }
    },

    async unhideReview(req, res) {
        const { id } = req.params;

        try {
            const existingReview = await ReviewModel.findById(id);
            if (!existingReview) {
                return res.status(404).json({ error: 'Review not found' });
            }

            await ReviewModel.unhideReview(id);
            res.json({ message: 'Review restored successfully' });
        } catch (error) {
            console.error('Error unhiding review:', error);
            res.status(500).json({ error: 'Failed to restore review' });
        }
    },

    async getAnalytics(req, res) {
        try {
            const avgRating = await ReviewModel.getAverageRating();
            const distribution = await ReviewModel.getRatingDistribution();

            const totalPublished = await ReviewModel.findAll({ status: 'published' });
            const totalHidden = await ReviewModel.findAll({ status: 'hidden' });

            res.json({
                data: {
                    averageRating: avgRating.average || 0,
                    totalReviews: avgRating.count,
                    distribution: distribution,
                    publishedCount: totalPublished.length,
                    hiddenCount: totalHidden.length
                }
            });
        } catch (error) {
            console.error('Error fetching analytics:', error);
            res.status(500).json({ error: 'Failed to fetch analytics' });
        }
    }
};

module.exports = reviewController;
