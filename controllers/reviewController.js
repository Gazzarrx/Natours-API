const Review = require('../models/reviewModel');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('../utils/appError');
const functionalityHandler = require('./functionalityHandler');

exports.setTourUserIds = (req, res, next) => {
    if (!req.body.tour) req.body.tour = req.params.tourId;
    if (!req.body.user) req.body.user = req.user.id;
    next();
};
// exports.setReviewsForEachTourId = (req, res, next) => {
//     // Allow nested GET reviews for each tour when the tourId
//     // detected in the params
//     let filter = {};
//     if (req.params.tourId) filter = {tour: req.params.tourId}
//     next();
// }
// Show all reviews
exports.getAllReviews = functionalityHandler.getAllDocs(Review);
exports.getSpecificReview = functionalityHandler.getDoc(Review);
// Add a new review to a tour
exports.addReview = functionalityHandler.createOne(Review);
exports.deleteReview = functionalityHandler.deleteOne(Review);
exports.updateReview = functionalityHandler.updateOne(Review);