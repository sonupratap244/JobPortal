const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/authMiddleware');
const profileController = require('../controllers/profileController');
const multer = require('multer');
const path = require('path');

// Multer config for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Routes
router.get('/', authMiddleware, profileController.viewProfile);
router.get('/edit', authMiddleware, profileController.editProfile);
router.post('/update', authMiddleware, upload.single('photo'), profileController.updateProfile);

module.exports = router;
