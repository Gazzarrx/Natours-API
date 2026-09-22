const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const app = require('./app');

// HANDLING UNCAUGHT EXCEPTION ERRORS LIKE THAT ONE => console.log(x) in the middle of nowhere between the application middlewares
process.on('uncaughtException', err => {
    console.log(err.name, err.message);
    console.log('UNCAUGHT EXCEPTION, SYSTEM SHUTTING DOWN...');
    process.exit(1);
});

// console.log(x);
const Db = process.env.DATABASE.replace(
    '<PASSWORD>',
    process.env.DATABASE_PASSWORD
);
mongoose
    // .connect(process.env.DATABASE_LOCAL, {
    .connect(Db, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useUnifiedTopology: true,
        useFindAndModify: false
    })
    .then(() => console.log('Database connection is successfull....'));
// const testTour = new Tour({
//     name: 'The Sky Pilot',
//     price: 900
// });

// testTour
//     .save()
//     .then(doc => {
//         console.log(doc);
//     })
//     .catch(err => {
//         console.log('ERROR!!!!');
//     });

//// Start the Server ////

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log(`Server is listening on port: ${port}....`);
});

// HANDLING UNHANDLED PROMISE REJECTION ERRORS OUT OF ERROR HANDLING THAT I IMPLEMENTED IT IN EXPRESS.JS
process.on('unhandledRejection', err => {
    console.log(err.name, err.message);
    console.log('UNHANDLER REJECTION, SYSTEM IS SHUTTING DOWN...');
    server.close(() => {
        process.exit(1);
    })
});