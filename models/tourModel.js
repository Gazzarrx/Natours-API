const mongoose = require('mongoose');
const slugify = require('slugify');
const User = require('./userModel');
// const validator = require('validator');

const tourSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'A tour must have a name'],
            unique: true,
            trim: true,
            maxLength: [40, 'The tour name must not exceed morethan 40 characters'],
            minLength: [10, 'The tour name must not be lessthan 10 characters'],
            // validate: [validator.isAlpha, 'Name must contain only characters']
        },
        duration: {
            type: Number,
            required: [true, 'A tour must have a duration']
        },
        maxGroupSize: {
            type: Number,
            required: [true, 'A tour must have a group size']
        },
        difficulty: {
            type: String,
            required: [true, 'A tour must have a difficulty'],
            // This type of validation is for String only
            enum: {
                values: ['easy', 'medium', 'difficult'],
                message: 'Difficulty is either : easy, medium or difficult'
            }
        },
        ratingsAverage: {
            type: Number,
            default: 4.5,
            min: [1, 'Rating must be Above 1.0'],
            max: [5, 'Rating must be below 5.0'],
            // the below line ensures that the ratingsAverage result
            // is rounded to two decimal places 4.7 instead of 4.666667
            set: val => Math.round(val * 10) / 10 
        },
        ratingsQuantity: {
            type: Number,
            default: 0
        },
        slug: String,
        price: {
            type: Number,
            required: [true, 'A tour must have a price']
        },
        priceDiscount: {
            type: Number,
            // this validation will only points to the new document creation not updating the current one
            validate: function (val) {
                return val < this.price
            },
            message: 'Discount price ({VALUE}) should be below regular price'
        },
        summary: {
            type: String,
            trim: true
        },
        description: {
            type: String,
            trim: true
        },
        imageCover: {
            type: String,
            required: [true, 'A tour must have a cover image']
        },
        images: [String],
        createdAt: {
            type: Date,
            default: Date.now(),
            // select: false
        },
        startDates: {
            type: [Date]
        },
        secretTour: {
            type: Boolean,
            default: false
        },
        startLocation: {
            // GeoJSON
            type: {
                type: String,
                default: 'Point',
                enum: ['Point']
            },
            coordinates: [Number],
            address: String,
            description: String
        },
        locations: [
            {
                type: {
                    type: String,
                    default: 'Point',
                    enum: ['Point']
                },
                coordinates: [Number],
                address: String,
                description: String,
                day: Number
            }
        ],
        guides: [
            {
                type: mongoose.Schema.ObjectId,
                ref: 'User'
            }
        ]
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// the following index is for increase the performance of the app
// while searching on anything specific according to the query
// so, instead of examining each document in the database
// it will directly examine the right ones which result in very big gap of performance
tourSchema.index({ price: 1, ratingsAverage: -1});
tourSchema.index({ slug : 1 });
tourSchema.index({ startLocations: '2dsphere' })

// Virtual properties
tourSchema.virtual('durationWeeks').get(function () {
    return this.duration / 7;
});
// Populate Reviews
tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id'
})
// DOCUMENT MIDDLEWARE => this will triggered and run before .save() & .create() mongodb functions
// tourSchema.pre('save', function (next) {
//     this.slug = slugify(this.name, { lower: true });
//     next();
// });
// tourSchema.pre('save', function (next) {
//     console.log('Will save the document....');
//     next();
// });
tourSchema.pre('save', async function (next) {
    const guidesPromise = this.guides.map(async id => await User.findById(id));
    this.guides = await Promise.all(guidesPromise);
    next();
});
// tourSchema.pre('aggregate', function (next) {
//     // console.log(this.pipeline());
//     this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//     next();
// });
//  QUERY MIDDLEWARE
tourSchema.pre(/^find/, function (next) {
    this.find({ secretTour: { $ne: true } });
    this.start = Date.now();
    next();
});
// the following query middleware populates the id's 
// In the guides in the tourmodel according to every query request starts with find
// Like get all tours and get specific tour by id
tourSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'guides',
        select: '-__v'
    })
    next();
})
// POST MIDDLEWARE WILL RUN AFTER THE PRE MIDDLEWARE
// tourSchema.post('save', function (doc, next) {
//     console.log(doc);
//     next();
// });
// DETERMINES HOW MUCH IT TAKES TIME RUNNING THE QUERY MIDDLEWARE ABOVE BY THIS POST MIDDLEWARE
// tourSchema.post(/^find/, function (doc, next) {
//     console.log(`Query took ${Date.now() - this.start}`);
//     console.log(doc);
//     next();
// });

// AGGREGATION MIDDLEWARE
// Mongoose model declaration here is little different because
// the model is being declared after it's already being created
// and this is the only way that will make the model functioning 
// if the switched declaration before the creation the model will never be called then
const Tour = mongoose.model('Tour', tourSchema);

// const testTour = new Tour({
//     name: 'The Sky Pilot',
//     price: 900,
//     duration: 6,
//     difficulty: "Medium"
// });

// testTour
//     .save()
//     .then(doc => {
//         console.log(doc);
//     })
//     .catch(err => {
//         console.log(err);
//     });

module.exports = Tour;
