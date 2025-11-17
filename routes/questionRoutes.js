const { Test, Question } = require('../models');
const upload = require('../middlewares/uploadExcel');
const express = require('express');
const router = express.Router();
const questionsController = require('../controllers/questionsController');

// Manage all tests and questions
router.get('/manage', questionsController.manageQuestions);

// Create question
router.get('/create/:testId', questionsController.createForm);
router.post('/create', questionsController.createQuestion);

// Edit question
router.get('/edit/:id', questionsController.editForm);
router.post('/edit/:id', questionsController.updateQuestion);

// Delete question
router.get('/delete/:id', questionsController.deleteQuestion);
router.get('/view-paper/:testId', async (req, res) => {
  const testId = req.params.testId;

  try {
    // Fetch test and its questions from DB 
    const test = await Test.findByPk(testId, {
      include: ['questions'] // or appropriate include syntax
    });

    if (!test) {
      return res.status(404).send('Test not found');
    }

    // Render a view to show the question paper
    res.render('questions/view-paper', { test, user : req.user || null });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});


// Excel upload -> preview
router.post('/uploadPreview', upload.single('excelFile'), questionsController.uploadPreview);

// Confirm save -> saves validated rows to DB
router.post('/confirmUpload', questionsController.confirmUpload);



module.exports = router;
