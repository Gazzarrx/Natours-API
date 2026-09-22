const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('../utils/appError');
const functionalityHandler = require('./functionalityHandler');
const multer = require('multer');
const sharp = require('sharp');

const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/img/users')
    },
    filename: (req, file, cb) => {
        const ext = file.mimetype.split("/")[1];
        cb(null, `user-${req.user.id}-${Date.now()}.${ext}`)
    }
});

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new AppError('Sorry but you must upload an image only!!', 400), false);
    }
};
const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
});

exports.uploadTourImages = upload.fields([
    { name: 'imageCover', maxCount: 1 },
    { name: 'images', maxCount: 3 }
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
    if (!req.files.imageCover || !req.files.images) return next();
    // 1) Cover image
    req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
    await sharp(req.files.imageCover[0].buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${req.body.imageCover}`);
    // 2) Images
    req.body.images = req.files.images.map(img => `tour-${req.params.id}-${Date.now()}-${img.originalname}`);
    await Promise.all(
        req.body.images.map(async (image, i) => {
            await sharp(req.files.images[i].buffer)
                .resize(2000, 1333)
                .toFormat('jpeg')
                .jpeg({ quality: 90 })
                .toFile(`public/img/tours/${image}`);
        })
    );
    next();
});
// const mongoose = require('mongoose');

//// I'm no longer need this, it were just for testing
// const tours = JSON.parse(fs.readFileSync(`${__dirname}/../tours-simple.json`));

//// Route Handlers ////

//// This routing handlers below teach how to handle routing between Rest Api and client ////
// exports.checkBody = (req, res, next) => {
//     if (!req.body.name || !req.body.price) {
//         return res.status(400).json({
//             status: 'Fail',
//             message: 'Missing Name or Price!!'
//         });
//     }
//     next();
// };
// exports.checkId = (req, res, next, val) => {
//     console.log(`Tour id: ${val}`);
//     if (req.params.id * 1 >= tours.length) {
//         return res.status(404).json({
//             status: "Fail!",
//             message: "Invalid ID",
//         });
//     }
//     next();
// };
exports.aliasTopTours = (req, res, next) => {
    req.query.limit = 5;
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage,difficulty';
    next();
};
exports.getAllTours = functionalityHandler.getAllDocs(Tour);
exports.getSpecificTourById = functionalityHandler.getDoc(Tour, { path: 'reviews' });
exports.createTour = functionalityHandler.createOne(Tour);
exports.updateTours = functionalityHandler.updateOne(Tour);
exports.deleteTour = functionalityHandler.deleteOne(Tour);

// the following aggregate method is used in order to make statistics
// on the tours in our database.
// The $group stage groups the documents by the specified _id expression and applies aggregate functions.
// Meaning by _id is the aggregation make the output splited
// according to the difficulty expression like easy, medium, difficult
// and each expression has it's array of all the tours that has the common expression
// then calculate the number of tours in each expression by setting $sum : 1 in order to count each tour as one
// for the total sum of tours and the same goes for the numRatings
// and then calculate the average of each rating field in each tours that has the common expression
// in order to now the average rating to easy, medium, difficult expression
// and finally calculate the average, min and max price

exports.getTourStats = catchAsync(async (req, res, next) => {
    const stats = await Tour.aggregate([
        {
            $match: { ratingsAverage: { $gte: 4.5 } }
        },
        {
            $group: {
                // _id: '$difficulty',
                _id: { $toUpper: '$difficulty' },
                numTours: { $sum: 1 },
                numRatings: { $sum: '$ratingsQuantity' },
                avgRating: { $avg: '$ratingsAverage' },
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' }
            }
        },
        {
            $sort: { avgPrice: 1 }
        },
        // {
        //     $match: { _id: { $ne: 'EASY' } }
        // }
    ]);

    res.status(200).json({
        status: 'Success',
        data: {
            stats
        }
    });
    // try {
    // } catch (err) {
    //     res.status(400).json({
    //         status: 'Fail',
    //         message: err
    //     });
    // };
});
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
    const year = req.params.year * 1;
    const plan = await Tour.aggregate([
        {
            $unwind: '$startDates'
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-1-1`),
                    $lte: new Date(`${year}-12-31`)
                }
            }
        },
        {
            $group: {
                _id: { $month: '$startDates' },
                numTourStarts: { $sum: 1 },
                tours: { $push: '$name' }
            }
        },
        {
            $addFields: { month: '$_id' }
        },
        {
            $project: { _id: 0 }
        },
        {
            $sort: { numTourStarts: -1 }
        },
        {
            $limit: 6
        }
    ]);
    res.status(200).json({
        status: 'Success',
        data: {
            plan
        }
    });
    // try {
    // } catch (err) {
    //     res.status(400).json({
    //         status: 'Fail',
    //         message: err
    //     });
    // };
});
exports.toursWithin = catchAsync(async (req, res, next) => {
    const { distance, latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');
    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
    if (!lat || !lng) {
        next(
            new AppError(
                'You must provide the latitude and longitude',
                400
            )
        );
    }
    const tours = await Tour.find({
        startLocations: {
            $geoWithin: {
                $centerSphere: [
                    [lng, lat],
                    radius
                ]
            }
        }
    });
    res.status(200).json({
        status: 'Success',
        results: tours.length,
        data: tours
    });
});
exports.getDistances = catchAsync(async (req, res, next) => {
    const { latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');

    if (!lat || !lng) {
        next(
            new AppError(
                'You have to provide the lattitude and longitude',
                400
            )
        );
    }
    // the following line converts the distance from mile to kilometers and vice versa
    // according to the requested unit in query
    const multiplier = unit === 'mi' ? 0.000621371 : 0.001
    const distances = await Tour.aggregate([
        // The geoNear requires at least one of the fields contains
        // geoSpatialIndex like the line below which presents in tourModel file👇
        // which tourSchema.index({ startLocations: '2dsphere' })
        {
            $geoNear: {
                near: {
                    type: 'Point',
                    coordinates: [lng * 1, lat * 1]
                },
                distanceField: 'distance',
                distanceMultiplier: multiplier
                // distanceMultiplier: unit === 'mi' ? 0.000621371 : 0.001
            },
            $project: {
                distance: 1,
                name: 1
            }
        }
    ]);
    res.status(200).json({
        status: 'Success',
        data: distances
    })
});