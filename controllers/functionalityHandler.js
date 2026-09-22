const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');

exports.createOne = Model => catchAsync(async (req, res, next) => {
    const newDoc = await Model.create(req.body);
    // console.log(newTour);
    res.status(201).json({
        status: 'Success',
        data: {
            tour: newDoc
        }
    });
});

exports.deleteOne = Model => catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
        return next(new AppError('There is no document found with that ID', 404));
    }
    // SEND RESPONSE
    res.status(204).json({
        status: 'Success',
        data: null
    });
});

exports.updateOne = Model => catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        status: 'Success',
        data: {
            doc
        }
    })
});

exports.getDoc = (Model, popOptions) => catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    // .populate('reviews') // This is for populating 
    // the reviews field from the Review model with the id of the reviews field in the Tour model
    if (popOptions) query.populate(popOptions);
    const doc = await query;
    // In Case if the ID requested for a specific tour is not existed
    if (!doc) {
        return next(new AppError('There is no document found with that ID', 404));
    }
    res.status(200).json({
        status: 'Success',
        data: {
            doc
        }
    })
});

exports.getAllDocs = Model => catchAsync(async (req, res, next) => {
    // Allow nested GET reviews for each tour when the tourId
    // detected in the params
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId }
    // EXECUTE A QUERY
    const features = new APIFeatures(Model.find(filter), req.query)
        .filter()
        .sort()
        .fieldsLimit()
        .paginate();
    // The following .explain() function is for showing
    // The analysis of the quered request for example in order to
    // Know the totalDocsExamined
    // const doc = await features.query.explain();
    const doc = await features.query;
    res.status(200).json({
        status: 'Success',
        results: doc.length,
        data: {
            doc
        }
    });
});