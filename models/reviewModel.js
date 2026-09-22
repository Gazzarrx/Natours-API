const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
    {
        review: {
            type: String,
            required: [true, `Review can't be empty`]
        },
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        createdAt: {
            type: Date,
            default: Date.now()
        },
        tour: {
            type: mongoose.Schema.ObjectId,
            ref: 'Tour',
            required: [true, 'Review must belong to a Tour']
        },
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: [true, 'Review must belong to a User']
        }
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// the below middleware pervents duplicate reviews from being created
// as it maintains that a unique user just makes unique review to each tour
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// this entire function for basically creating the statistics and the average of number of ratings
// for the tourId for which the current of view was created
// and then the funciton is created the function as a static method to call the aggregate
// method on the model 
//// IN SHORT THE FOLLOWING FUNCTION CALCULATE THE NUMBER OF THE RATINGS REVIEWS AND THE AVERAGE OF RATINGS THAT'S BEING REVIEWD BY THE USERS ON THE CURRENT TOUR THAT'S BEING REQUESTED IN THE QUERY
reviewSchema.statics.calcAverageRatings = async function (tourId) {
    const stats = await this.aggregate([
        // and then here after matching all the reviews that matched with 
        // the tourId from the requested query
        {
            $match: { tour: tourId }
        },
        // then here is calculating the statistcs for all the reviews 
        {
            $group: {
                _id: '$tour',
                nRating: { $sum: 1 },
                avgRating: { $avg: '$rating' }
            }
        }
    ]);
    console.log(stats);
    // then we save the statistics to the current tour which requested from the query
    if (stats.length > 0) {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: stats[0].nRating,
            ratingsAverage: stats[0].avgRating
        });
    } else {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: 0,
            ratingsAverage: 4.5
        });
    }
};
// then in order to call the function it must be after a
// new review has been created .post
reviewSchema.post('save', function () {
    // here we wrote this.constructor in order to point to the current model
    // then we saved the review in calcAverageRatings method by tourId
    this.constructor.calcAverageRatings(this.tour);
});
// the following middlware is used to save the last review content 
// before it's being updated by .pre and save it in the r variable
reviewSchema.pre(/^findOneAnd/, async function (next) {
    this.r = await this.findOne();
    console.log(this.r);
    next();
});
reviewSchema.post(/^findOneAnd/, async function () {
    // this.r = await this.findOne(); // this doesn't work here because
    // the query has already been executed so we need .pre 👆 
    // as in the previous middleware to do this
    await this.r.constructor.calcAverageRatings(this.r.tour);
});
// beware that this .populate method affects the performance of the application
reviewSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'user',
        select: 'name'
    })
    next();
})

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;