const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewController = require('./../controllers/reviewController');
const reviewRouter = require('./../routes/reviewRouter');

const router = express.Router();

// Nested Routes
router.use('/:tourId/reviews', reviewRouter);
// .route('/:tourId/reviews')
// .post(
//     authController.protect,
//     authController.restrictTo('user'),
//     reviewController.addReview
// )
//// Routes ////

//// Here's below a param middleware ////
// router.param('id', tourController.checkId);
router
    .route('/top-5-cheap')
    .get(tourController.aliasTopTours, tourController.getAllTours);
router
    .route('/getTourStats')
    .get(tourController.getTourStats);
router
    .route('/monthly-plan/:year')
    .get(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide', 'guide'),
        tourController.getMonthlyPlan
    );
router
    .route("/")
    .get(tourController.getAllTours)
    .post(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide', 'guide'),
        tourController.createTour
    );
router
    .route(`/:id`)
    .get(tourController.getSpecificTourById)
    .patch(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide', 'guide'),
        tourController.uploadTourImages,
        tourController.resizeTourImages,
        tourController.updateTours
    )
    .delete(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        tourController.deleteTour
    );
router
    .route('/tours-within/:distance/center/:latlng/unit/:unit')
    .get(tourController.toursWithin);
router
    .route('/distances/:latlng/unit/:unit')
    .get(tourController.getDistances);

module.exports = router;