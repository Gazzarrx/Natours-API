const express = require('express');
const authController = require('./../controllers/authController');
const reviewController = require('./../controllers/reviewController');
const router = express.Router({ mergeParams: true });

router.use(authController.protect);
router
    .route('/')
    .get(
        // reviewController.setReviewsForEachTourId,
        reviewController.getAllReviews
    )
    .post(
        authController.restrictTo('user'),
        reviewController.setTourUserIds,
        reviewController.addReview
    )

router
    .route('/:id')
    .get(reviewController.getSpecificReview)
    .delete(authController.restrictTo('user', 'admin'), reviewController.deleteReview)
    .patch(authController.restrictTo('user', 'admin'), reviewController.updateReview);

module.exports = router;