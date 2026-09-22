class AppError extends Error {
    constructor(message, statusCode) {
        super(message);

        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        // This line marks and gives your class and every module that extends the class this (isOperational) property
        // In case if any unexpected error appears from the required packages in the project or other
        this.isOperational = true;
        // This line captures stackError which means that when an Error appears it tells you in which module is it
        // And it code line number
        Error.captureStackTrace(this, this.constructor);
    };
};

module.exports = AppError;