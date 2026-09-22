const AppError = require('../utils/appError');

const handleCastErrorDB = err => {
    const message = `Invalid ${err.path} : ${err.value}.`;
    return new AppError(message, 400);
};

const handleDuplicateErrorDB = err => {
    const value = err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];
    const message = `The name ${value} already exists, please find another name`;
    return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data ${errors.join('. ')}`;
    return new AppError(message, 400);
};

const handleJWTError = () => {
    const message = 'Invalid token, please login again!!';
    return new AppError(message, 401);
}

const handleJWTExpiredError = () => {
    const message = 'Your token is expired, login again';
    return new AppError(message, 401);
}

const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        err: err,
        message: err.message,
        stack: err.stack
    });
};
const sendErrorProd = (err, res) => {
    // Operational , trusted error : Send error to the client
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
        // Programming or other unknown error : don't leak error details
    } else {
        //log error
        console.error('Error', err);
        // generic message
        res.status(500).json({
            status: 'error',
            message: err
        })
    }

};
module.exports = (err, req, res, next) => {
    // console.log(err.stack);
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res);
    } else if (process.env.NODE_ENV === 'production') {
        // let error = { ...err };
        // Handling unhandled CastErrors
        if (err.name === 'CastError') err = handleCastErrorDB(err);
        // Handling Duplicate Fields Errors
        if (err.code === 11000) err = handleDuplicateErrorDB(err);
        // Handling ValidationError
        if (err.name === 'ValidationError') err = handleValidationErrorDB(err);
        // Handling JsonWebTokenError that occurs when the requested token in not correct
        if (err.name === 'JsonWebTokenError') err = handleJWTError();
        // Handling TokenExpiredError that occurs when token gets expired
        if (err.name === 'TokenExpiredError') err = handleJWTExpiredError();
        // This line for passing the error to the sendErrorProd function in case the program is running on production
        sendErrorProd(err, res);
    }
};