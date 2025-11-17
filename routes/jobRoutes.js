const express = require('express');
const router = express.Router();
const jobsController = require('../controllers/jobsController');
const { Job } = require('../models');
const { authMiddleware, adminMiddleware } = require('../middlewares/authMiddleware');


// List all jobs (admin only)
router.get('/list', authMiddleware, adminMiddleware, jobsController.listJobs);

// Show create job form (admin only)
router.get('/create', authMiddleware, adminMiddleware, jobsController.createForm);

// Store new job (admin only)
router.post('/create', authMiddleware, adminMiddleware, jobsController.storeJob);

// Show edit job form (admin only)
router.get('/edit/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const singleJob = await Job.findByPk(req.params.id);
    if (!singleJob) return res.status(404).send('Job not found');
    res.render('jobs/edit', { job: singleJob, user: req.user, error: null });
  } catch (error) {
    console.error('Error loading edit page:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Update job (admin only)
router.post('/edit/:id', authMiddleware, adminMiddleware, async (req, res) => {
  const { title, description, location, status } = req.body;
  try {
    const [updated] = await Job.update(
      { title, description, location, status },
      { where: { id: req.params.id } }
    );
    if (updated) return res.redirect('/jobs/list');
    res.render('jobs/edit', { job: req.body, user: req.user, error: 'Failed to update job' });
  } catch (error) {
    console.error(error);
    res.render('jobs/edit', { job: req.body, user: req.user, error: 'Failed to update job' });
  }
});

// Delete job (admin only)
router.get('/delete/:id', authMiddleware, adminMiddleware, jobsController.deleteJob);

// View applicants for a job (admin only)
router.get('/:id/applicants', authMiddleware, adminMiddleware, jobsController.viewApplicants);

// Assign test to candidate (admin only)
router.post('/tests/assign', authMiddleware, adminMiddleware, jobsController.assignTestToCandidate);


router.get('/current', authMiddleware, jobsController.viewCurrentJobs);

module.exports = router;
