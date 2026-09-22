const { promisify } = require('util');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    })
}

const createSignToken = (user, statusCode, res) => {
    
    const token = signToken(user._id);
    // below is the variable the stores the cookie options
    // like expire date others to manage the way 
    // which the cookie will be created as it is
    const cookieOptions = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
        ),
        httpOnly: true
    };
    // if condition in order to transmitting the cookies encrypted in production
    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
    // here is the response which responsible for sending the cookie
    res.cookie('jwt', token, cookieOptions);

    // remove the password from the output
    user.password = undefined;
    res.status(statusCode).json({
        status: 'Success',
        token,
        data: {
            user
        }
    });
}
exports.signUp = catchAsync(async (req, res, next) => {
    // I will replace this line of code with the one below in order to accept only the field that i will include in this function
    // const newUser = await User.create(req.body);
    const newUser = await User.create({
        role: req.body.role,
        name: req.body.name,
        email: req.body.email,
        photo: req.body.photo,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        passwordChangedAt: req.body.passwordChangedAt
    });

    // this is a variable refers to jwt (jsonwebtoken) method and signing to it any newUser that recently created from the POST
    // Request through it's id and asign to it a secret incryption not lessthan 32 which you must create
    // All of this for the token to make the newUser signed in after it recently created it's account for a specific expire date
    // that you asign to the newUser inside the token variable => expiresIn: process.env.JWT_EXPIRES_IN
    createSignToken(newUser, 201, res);
});


// exports.login = catchAsync(async (req, res, next) => {
//     // Here's an Object destructuring for the inputs that will be inputed 
//     // In the login
//     const { email, password } = req.body;

//     // Checking if the email and password inputed and correct
//     if (!email || !password) {
//         return next(new AppError('Please write the email and password!!'));
//     }
//     // Checking if the user exists and password is correct
//     const user = await User.findOne({ email }).select('+password');
//     // const correct = await user.correctPassword(password, user.password);

//     if (!user || !(await user.correctPassword(password, user.password))) {
//         return next(new AppError('Incorrect email or password!!', 401));
//     }

//     // If all okay, Send to the user a token in case the user exists
//     const token = signToken(user._id);
//     res.status(200).json({
//         status: 'Success',
//         token
//     });
// });

// A Login function for logging in the user
exports.login = catchAsync(async (req, res, next) => {
    // Here's an Object destructuring for the inputs that will be inputed
    const { email, password } = req.body;
    // check if the email and password are inputed if not
    if (!email || !password) {
        return next(new AppError('Please enter your email and password'));
    };

    // check if user exists and password is correct
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Sorry, user does not exist or the password is not correct', 400))
    };

    // If all okay send the token to the client
    createSignToken(user, 200, res);
});
// The following function for checking the authenticity of the logged users and if their is JWT tokens exists for them or not
// And if that's okay then fine allow access for the user automatically
exports.protect = catchAsync(async (req, res, next) => {
    // Checking if the user's JWT exist in the authorization and if it do then it will be assigned to the variable named token
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    // console.log(token);
    // If there's no token inputed in the authorization then that means that there's no token so, a new Error by
    // The Global Error handling middleware will rsend a message with status code 401(unauthorized)
    if (!token) {
        return next(new AppError('You are not logged in, please login to get access!', 401));
    }
    // Token verification
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    // console.log(decoded);
    // Checking if the user is still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
        return next(new AppError('The user is deleted, please sign up again', 401));
    }
    // Checking if the user has changed his password after thre token issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next(new AppError('The user has changed the password, please login again!!', 401));
    };
    console.log(currentUser);

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;
    next();
});

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(
                new AppError(`You don't have permission for this action`, 403)
            );
        }
        next();
    };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {

    // Get the user's email from the one gets posted or requested from 
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return next(new AppError(`There's no user with this email address`, 404));
    };

    // Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetURL = `${req.protocol}://${req.get(
        'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    const message = `If you forgot your password, please click on this link to reset your password: ${resetURL}.\nIf you don't, please ignore that email`;

    try {
        await sendEmail({
            email: user.email,
            subject: 'Your password reset token (valid for 10min)',
            message: message
        });

        res.status(200).json({
            status: 'Success',
            message: 'Token sent to email!'
        });
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        user.save({ validateBeforeSave: false });
        // return next(new Error(err));
        return next(new AppError('There was an error sending the email. try again'), 500);
    }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
    // Get user based on the token
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    });

    // According to the following if condition if the token hasn't expired 
    // And there is a user, set the new password
    if (!user) {
        return next(new AppError('Token is invalid or has expired', 400));
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // 3) Update the changedPasswordAt property for the user
    // Through userModel Module line:54
    // 4) Log The user in, send him/her the JWT
    createSignToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
    // 1) Get user from collection
    const user = await User.findById(req.user.id).select('+password');
    //  2) Check if posted current password is correct
    if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(new AppError(`The current password doesn't match the user's password`, 401));
    }
    // 3) If all okay then save the password and password confirm
    user.password = req.body.passowrd;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();
    // log user in and send JWT
    createSignToken(user, 200, res);
});
