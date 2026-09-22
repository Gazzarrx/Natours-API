const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const functionalityHandler = require('./../controllers/functionalityHandler');
const multer = require('multer');
const sharp = require('sharp');

// Multer configuration for user photo upload
//// Route Handlers ////
//// This routing handlers below teach how to handle routing between Rest Api and client ////
// The following function responsible for uploading user's photo

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

exports.uploadUserImage = upload.single('photo');
exports.resizeUserImage = catchAsync(async (req, res, next) => {
    if (!req.file) return next();

    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`
    await sharp(req.file.buffer)
        .resize(500, 500)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/users/${req.file.filename}`);

    next();
});
const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
};

exports.updateMe = catchAsync(async (req, res, next) => {
    // Check if the posted not includes password
    // As this route not for updating passwords
    if (req.body.password || req.body.passwordConfirm) {
        return next(new AppError('Sorry this route not for updating passwords please try /updatePassword this route', 400));
    }
    // filtered out field names that are not allowed to be updated
    const filteredBody = filterObj(req.body, 'name', 'email');
    if (req.file) filteredBody.photo = req.file.filename;
    // update user document
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        status: 'Success',
        data: {
            user: updatedUser
        }
    })
});
exports.deleteMe = catchAsync(async (req, res, next) => {

    await User.findByIdAndUpdate(req.user.id, { active: false });

    res.status(204).json({
        status: 'Success',
        data: null
    });
});
exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next();
};
exports.getSpecificUser = functionalityHandler.getDoc(User);
exports.getAllUsers = functionalityHandler.getAllDocs(User);
exports.createUser = functionalityHandler.createOne(User);
exports.updateUser = functionalityHandler.updateOne(User);
exports.deleteUser = functionalityHandler.deleteOne(User);