const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

router.use(authenticate);

router.post('/', reviewController.createReview);
router.get('/my-reviews', reviewController.getMyReviews);
router.get('/:id', reviewController.getReviewById);
router.put('/:id', reviewController.updateReview);
router.delete('/:id', reviewController.deleteReview);

router.get('/admin/reviews', authorizeAdmin, reviewController.getAllReviews);
router.put('/admin/reviews/:id/hide', authorizeAdmin, reviewController.hideReview);
router.put('/admin/reviews/:id/unhide', authorizeAdmin, reviewController.unhideReview);
router.get('/admin/reviews/analytics', authorizeAdmin, reviewController.getAnalytics);

module.exports = router;
