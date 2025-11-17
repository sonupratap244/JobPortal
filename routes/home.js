
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authMiddleware } = require('../middlewares/authMiddleware');

router.get('/', (req, res) => res.redirect('/home')); 
router.get('/home', authMiddleware, dashboardController.dashboard);

module.exports = router;


