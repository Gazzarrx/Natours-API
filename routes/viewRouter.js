const express = require('express');
const viewController = require('../controllers/viewController');
const router = express.Router();
// Here's the following two rendering pages overview and tour this is how we supposed to connect the frontend with the backend here
// But this way of connection is when your intention is to make the whole backend in control of everything so you make the frontend pages
// Inside the backend folder
// However there's another ways to connect the backend with the frontend 

// router.get('/', (req, res) => {
    //     res.status(200).render('base', {
        //         tour: 'The Forest Hiker',
        //         user: 'Gazzarxx'
//     });
// });
router.get('/', viewController.getOverview);
router.get('/tour/:slug', viewController.getTour);

module.exports = router;