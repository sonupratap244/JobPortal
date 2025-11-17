const { Candidate, Job } = require('../models');
const express = require('express');
const router = express.Router();
const candidateController = require('../controllers/candidateController');
const { authMiddleware, adminMiddleware } = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');

// ----------------- Multer Setup -----------------
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/\s+/g, '-');
    cb(null, `${timestamp}-${name}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = /pdf|doc|docx/;
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.test(ext)) cb(null, true);
  else cb(new Error('Only PDF, DOC, DOCX files are allowed!'));
};

const upload = multer({ storage, fileFilter });

// ----------------- Routes -----------------

// Show candidate application form
router.get('/candidates/create', authMiddleware, candidateController.createForm);

// Handle candidate form submission
router.post(
  '/candidates/create',
  authMiddleware,
  upload.array('documents', 5), // same name 
  candidateController.storeCandidate
);



// List all candidates (admin only)
router.get('/candidates/list', authMiddleware, adminMiddleware, candidateController.listCandidates);


// View candidate
 router.get('/candidates/view/:id', authMiddleware, candidateController.viewCandidate);


// Delete candidate
router.get('/candidates/delete/:id', authMiddleware, candidateController.deleteCandidate);

// Edit candidate
router.get('/candidates/edit/:id', authMiddleware, candidateController.editCandidate);


router.post(
  '/candidates/update/:id',
  authMiddleware,
  upload.array('documents', 10),
  candidateController.updateCandidate
);


router.get("/status", authMiddleware, candidateController.getStatusPage);

//  Recruiter updates Candidate Status
router.post("/candidates/:id/status", authMiddleware, candidateController.updateCandidateStatus);



// Candidate success page

router.get('/candidates/success', (req, res) => {
  const name = req.query.name || 'Candidate';
  res.render('candidates/success', { name, user: req.user || null });
});

module.exports = router;
