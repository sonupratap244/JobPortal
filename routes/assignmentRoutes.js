const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');

// router.get('/', assignmentController.list);
router.get('/create', assignmentController.createForm);
router.post('/create', assignmentController.create);

router.get('/edit/:id', assignmentController.editForm);
router.post('/edit/:id', assignmentController.edit);

router.post('/delete/:id', assignmentController.delete);

router.get('/view/:id', assignmentController.view);

module.exports = router;
