const express = require("express");
const morgan = require('morgan');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRouter');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const path = require('path');
const app = express();
const viewRouter = require('./routes/viewRouter');

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

//// Global Middlewares ////
// Serving static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(helmet());
// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
// Development logging
console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
};
// Middleware function that limits the amount of requests 
// To prevent DDos and Brute force attacks
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests from this ip, try again in one hour'
});
app.use('/api', limiter);
// Data Sanitization against NOSQL query injection
app.use(mongoSanitize());
// Data Sanitization against Xss-Scripts
app.use(xss());
// Prevent Parameter Pollution
app.use(hpp({
    whitelist: [
        'duration',
        'ratingsQuantity',
        'ratingsAverage',
        'difficulty',
        'maxGroupSize',
        'price'
    ]
}));
//// This last two basic middlwares is made by me unlike the first one which is ////
// Already provided as a callback function ////
// app.use((req, res, next) => {
//     console.log('Hello from the Middleware!!!!');
//     next();
// });

// Testing middleware's running time 
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    next();
});

// Here's begin the route handling //

// app.get('/', (req, res) => {
//     // res.status(200).send('Hello from the server side');
//     res
//         .status(200)
//         .json({message: 'Hello from the server side!!!!', app: 'Natours'});
// });
// app.post('/', (req, res) => {
//     res.send('You can post at this endpoint!');
// });


// app.get('/api/v1/tours', getAllTours);
//// That below is a special routing handler which handles specific parameters requested //
// between Rest Api and client ////
// app.get(`/api/v1/tours/:id`, getSpecificTourById);
// app.post('/api/v1/tours', createTour);
// app.patch(`/api/v1/tours/:id`, updateTours);
// app.delete('/api/v1/tours/:id', deleteTour);

//// Frontend Routes ////

app.use('/', viewRouter);

//// Backend Routes ////

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

app.all('*', (req, res, next) => {
    // res.status(404).json({
    //     status: 'fail',
    //     message: `Can't find ${req.originalUrl} on this server!!`
    // });
    // const err = new Error(`Can't find ${req.originalUrl} on this server!!`);
    // err.statusCode = 404;
    // err.status = 'fail'
    next(new AppError(`Can't find ${req.originalUrl} on this server!!`, 404));
});

// THAT'S A GLOBAL ERROR HANDLING MIDDLEWARE INCLUDES ALL WRONG ROUTES THAT MIGHT BE REQUESTED AND NOT HANDLED
// AND FROM ANY HTTP METHOD WHATEVER IT IS (GET, POST, PATCH, DELETE) 
app.use(globalErrorHandler);

module.exports = app;
