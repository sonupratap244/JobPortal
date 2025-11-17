const { Job, Candidate, Experience, Qualification,Assignment,Test  } = require('../models');


const crypto = require('crypto');
const nodemailer = require('nodemailer');
// List all jobs
exports.listJobs = async (req, res) => {
  try {
    const jobs = await Job.findAll({
      include: [{ model: Candidate, as: 'Candidates' }]
    });
    res.render('jobs/list', { jobs, user: req.user || null });
  } catch (err) {
    console.error('Jobs fetch error:', err);
    res.status(500).send('Internal Server Error');
  }
};



// Show create job form
exports.createForm = (req, res) => {
  res.render('jobs/create', { job: null, user: req.user });
};

// Store new job
exports.storeJob = async (req, res) => {
  try {
    const { title, experienceLevel, description, status, location, ctc } = req.body;
    await Job.create({ title, experienceLevel, description, status, location, ctc });
    res.redirect('/jobs/list');
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
};

// Show edit job form
exports.editForm = async (req, res) => {
  try {
    const job = await Job.findByPk(req.params.id);
    if (!job) return res.status(404).send('Job not found');
    res.render('jobs/create', { job, user: req.user });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
};

// Update job
exports.updateJob = async (req, res) => {
  try {
    console.log('Updating job with ID:', req.params.id);
    console.log('Form data:', req.body);

    const job = await Job.findByPk(req.params.id);
    if (!job) return res.status(404).send('Job not found');

    const { title, experienceLevel, description, status, location, ctc } = req.body;

    await job.update({
      title,
      experienceLevel,
       description, 
      status,
      location,
      ctc
    });

    res.redirect('/jobs/list');
  } catch (err) {
    console.error('Error updating job:', err);
    res.status(500).send('Internal Server Error');
  }
};


// Delete job
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findByPk(req.params.id);
    if (!job) return res.status(404).send('Job not found');

    // Delete associat
    await Candidate.destroy({ where: { jobId: job.id } });

    // Then delete the job
    await job.destroy();

    res.redirect('/jobs/list');
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
};


//  View applicants for 

exports.viewApplicants = async (req, res) => {
  try {
    const jobId = req.params.id;

    // Fetch job 
    const job = await Job.findByPk(jobId, {
      include: [
        {
          model: Candidate,
          as: 'Candidates',
          include: [
            { model: Experience, as: 'Experiences' },
            { model: Qualification, as: 'Qualifications' }
          ]
        }
      ]
    });

    if (!job) return res.status(404).send('Job not found');

    // Fetch all assignments 
    const tests = await Test.findAll();

    res.render('jobs/applicants', {
      job,
      applicants: job.Candidates || [],
      user: req.user || null,
      tests
    });
  } catch (err) {
    console.error(' Error fetching applicants:', err);
    res.status(500).send('Internal Server Error');
  }
};



exports.viewCurrentJobs = async (req, res) => {
  try {
    const userEmail = req.user?.email; // logged-in user email

    // Fetch all jobs (active + inactive)
    const jobs = await Job.findAll({
      order: [['createdAt', 'DESC']],
    });

    // Get all jobIds that this user has already applied to
    const appliedCandidates = await Candidate.findAll({
      where: { userEmail },
      attributes: ['jobId'],
    });

    // Extract only job IDs
    const appliedJobIds = appliedCandidates.map(c => c.jobId);

    // Render the page
    res.render('jobs/current', {
      jobs,
      appliedJobIds,
      user: req.user,
    });
  } catch (err) {
    console.error(' Error loading current jobs:', err);
    res.status(500).send('Internal Server Error');
  }
};



exports.assignTestToCandidate = async (req, res) => {
  try {
    const { candidateId, testId } = req.body;

    // 🔹 Fetch candidate
    const candidate = await Candidate.findByPk(candidateId);
    if (!candidate) return res.status(404).send("Candidate not found");

    const jobId = candidate.jobId;
    const email = candidate.email; // send to candidate's own email

    //  Fetch test
    const test = await Test.findByPk(testId);
    if (!test) return res.status(404).send("Test not found");

    //  Create test assignment
    await Assignment.create({
      candidateId,
      testId,
      email,
      status: "Pending",
      title: test.title,
    });

    //  Update candidate record
    await Candidate.update({ testAssigned: testId }, { where: { id: candidateId } });

    //  Setup mail transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    //  Test link
    const testLink = `http://localhost:3000/candidate/tests`;

    //  Send VIP Email 
    const html = `
      <div style="font-family: 'Poppins', Arial, sans-serif; background-color: #f4f6fa; padding: 40px;">
        <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow: hidden;">
          <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 24px 32px; text-align: center;">
            <img src="https://alobhahrms.com/storage/uploads/logo/logo-dark.png" alt="Alobh Technology" style="height: 50px; margin-bottom: 10px;">
            <h2 style="color: #fff; font-weight: 600; margin: 0;">Alobha Technology Pvt. Ltd.</h2>
          </div>

          <div style="padding: 32px;">
            <h3 style="color: #1e1e2f; font-size: 22px; margin-bottom: 16px;">Hello ${candidate.name},</h3>
            <p style="color: #444; font-size: 16px; line-height: 1.6;">
              Congratulations! You’ve been assigned a new test as part of the recruitment process for <strong>${test.title}</strong>.
            </p>
            
            <div style="background-color: #f9f9fc; border-left: 4px solid #4f46e5; padding: 16px; margin: 24px 0; border-radius: 8px;">
              <p style="margin: 0; font-size: 16px; color: #333;">
                <strong>Test Title:</strong> ${test.title}<br>
                <strong>Total Marks:</strong> ${test.totalMarks}<br>
                <strong>Passing Marks:</strong> ${test.passingMarks}
              </p>
            </div>

            <p style="color: #555; font-size: 15px; margin-bottom: 24px;">
              Please click the button below to start your test. Make sure you are in a quiet place and have a stable internet connection.
            </p>

            <div style="text-align: center; margin-bottom: 32px;">
              <a href="${testLink}" 
                 style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; letter-spacing: 0.3px;">
                Start Test
              </a>
            </div>

            // <p style="color: #888; font-size: 14px;">
            //   If the button doesn’t work, copy and paste this link into your browser:<br>
            //   <a href="${testLink}" style="color: #4f46e5;">${testLink}</a>
            // </p>

            <p style="margin-top: 32px; color: #777; font-size: 14px; text-align: center;">
              Best of luck!<br>
              <strong>Alobha Technology Recruitment Team</strong>
            </p>
          </div>

          <div style="background-color: #f1f3f9; text-align: center; padding: 14px; font-size: 13px; color: #666;">
            © ${new Date().getFullYear()} Alobh Technology Pvt. Ltd. — All rights reserved.
          </div>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Alobha Technology" <${process.env.SMTP_FROM}>`,
      to: email,
      subject: ` Test Assigned: ${test.title}`,
      html,
    });

    res.redirect(`/jobs/${jobId}/applicants`);
  } catch (err) {
    console.error(" Assign test error:", err);
    res.status(500).send("Internal Server Error");
  }
};

