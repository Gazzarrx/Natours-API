const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

//// Routes ////
const router = express.Router();
// User routes
router
    .route('/me')
    .get(
        authController.protect,
        userController.getMe,
        userController.getSpecificUser
    )

router
    .route('/signup')
    .post(authController.signUp);

router
    .route('/login')
    .post(authController.login);

router
    .route('/forgotPassword')
    .post(authController.forgotPassword);

router
    .route('/resetPassword/:token')
    .patch(authController.resetPassword);

router.use(authController.protect);

router
    .route('/updateMyPassword')
    .patch(authController.protect, authController.updatePassword);

router
    .route('/updateMe')
    .patch(
        authController.protect,
        userController.uploadUserImage,
        userController.updateMe
    );

router
    .route('/deleteMe')
    .delete(
        authController.protect,
        userController.deleteMe
    );

router.use(authController.restrictTo('admin'));

router
    .route('/')
    .get(userController.getAllUsers)
    .post(userController.createUser)

router
    .route('/:id')
    .get(userController.getSpecificUser)
    .patch(userController.updateUser)
    .delete(userController.deleteUser);

module.exports = router;
