const { Candidate, Experience, Qualification,Result, Reference, Questionnaire, Job,Test,Answer } = require('../models');
const sendMail = require('../utils/mailer');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { Op,Sequelize } = require("sequelize");

// value is always an array
const ensureArray = value => value ? (Array.isArray(value) ? value : [value]) : [];

// MULTER 

// Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  allowedTypes.includes(file.mimetype) ? cb(null, true) : cb(new Error('Only PDF/DOC/DOCX files are allowed'));
};

// Multer instance
const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB



// CREATE Form 
exports.createForm = async (req, res) => {
  try {
    const selectedJobId = req.query.jobId || null;
    const jobs = await Job.findAll({ where: { status: 'Active' } });
    res.render('candidates/create', { jobs, selectedJobId, error: null, user: req.user || null });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading form');
  }
};

// STORE CANDIDATE 
exports.storeCandidate = [
  async (req, res) => {
    try {

      const {
        jobId, experienceYears, fresher, name, dob, age, maritalStatus,
        address, contactNo, email, currentCTC, expectedCTC, noticePeriod,
        technicalSkills, strengths, improvement, reasonsLeaving, achievements, valueAddition
      } = req.body;

      const job = await Job.findByPk(jobId);
      if (!job) throw new Error('Selected job not found!');

      // Uploaded documents
      const documentPaths = req.files?.map(f => f.filename) || [];

      const loginEmail = req.user?.email;

      // Create Candidate
      const candidate = await Candidate.create({
        jobId, experienceYears, fresher: !!fresher, name, dob, age, maritalStatus,
        address, contactNo, email: loginEmail,
        userEmail: loginEmail, currentCTC, expectedCTC, noticePeriod,
        documents: documentPaths.join(','), userEmail: req.user.email,
       documents: documentPaths.join(','), userEmail: email
      });

      //  Experiences 
      const expCompanies = ensureArray(req.body.experiences?.company);
      const expDesignations = ensureArray(req.body.experiences?.designation);
      const expFroms = ensureArray(req.body.experiences?.from);
      const expTos = ensureArray(req.body.experiences?.to);
      const expSalaries = ensureArray(req.body.experiences?.salary);
      const expReasons = ensureArray(req.body.experiences?.reasonLeaving);

      for (let i = 0; i < expCompanies.length; i++) {
        if (expCompanies[i]) {
          await Experience.create({
            candidateId: candidate.id,
            company: expCompanies[i],
            designation: expDesignations[i],
            from: expFroms[i] || null,
            to: expTos[i] || null,
            salary: expSalaries[i],
            reasonLeaving: expReasons[i]
          });
        }
      }

      // Qualifications 
      const qualCourses = ensureArray(req.body.qualifications?.course);
      const qualBoards = ensureArray(req.body.qualifications?.board);
      const qualYears = ensureArray(req.body.qualifications?.year);
      const qualDivisions = ensureArray(req.body.qualifications?.division);

      for (let i = 0; i < qualCourses.length; i++) {
        if (qualCourses[i]) {
          await Qualification.create({
            candidateId: candidate.id,
            course: qualCourses[i],
            board: qualBoards[i],
            year: qualYears[i],
            division: qualDivisions[i]
          });
        }
      }

      //  References 
      const refNames = ensureArray(req.body.references?.name);
      const refDesignations = ensureArray(req.body.references?.designation);
      const refCompanies = ensureArray(req.body.references?.company);

      for (let i = 0; i < refNames.length; i++) {
        if (refNames[i]) {
          await Reference.create({
            candidateId: candidate.id,
            name: refNames[i],
            designation: refDesignations[i],
            company: refCompanies[i]
          });
        }
      }

      //  Questionnaire 
      await Questionnaire.create({
        candidateId: candidate.id,
        keyTechnicalExpertise: technicalSkills,
        majorStrengths: strengths,
        improvementArea: improvement,
        reasonLeavingPreviousJobs: reasonsLeaving,
        majorAchievements: achievements,
        valueAddition
      });

      
      
//  Send Email 
const html = `
  <div style="font-family: 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f7f9fc; padding: 40px 0;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 5px 15px rgba(0,0,0,0.08);">
      
      <!-- Header with Logo -->
      <div style="background: linear-gradient(90deg, #4f46e5, #9333ea); padding: 24px; text-align: center;">
        <img src="https://alobhahrms.com/storage/uploads/logo/logo-dark.png" 
             alt="Alobha Technology" 
             style="height: 60px; margin-bottom: 10px;">
        <h1 style="color: #ffffff; font-size: 22px; font-weight: 600; margin: 0;">Alobha Technology</h1>
      </div>

      <!-- Body -->
      <div style="padding: 32px;">
        <h2 style="color: #333; font-size: 20px;">Hello <span style="color:#4f46e5;">${candidate.name}</span>,</h2>
        <p style="color: #555; font-size: 15px; line-height: 1.7; margin-top: 16px;">
          Thank you for applying for the position of 
          <strong style="color: #4f46e5;">${job.title}</strong> at 
          <strong>Alobha Technology</strong>.
        </p>

        <p style="color: #555; font-size: 15px; line-height: 1.7;">
          We’ve successfully received your application. Our HR team will carefully review your profile and reach out to you if you are shortlisted for the next round.
        </p>

        <p style="color: #555; font-size: 15px; line-height: 1.7;">
          Meanwhile, you can check your <a href="https://alobhatechnologies.com" style="color: #4f46e5; text-decoration: none; font-weight: 600;">application status</a> anytime by logging into your candidate dashboard.
        </p>

        <div style="margin: 28px 0; text-align: center;">
          <a href="https://alobhatechnologies.com" 
             style="background: linear-gradient(90deg, #4f46e5, #9333ea); color: white; padding: 12px 28px; border-radius: 30px; text-decoration: none; font-weight: 600; display: inline-block; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
            Visit Alobha Technology
          </a>
        </div>

        <p style="color: #777; font-size: 13px; text-align: center; margin-top: 30px;">
          Thank you for your interest in joining <strong>Alobha Technology</strong>.<br>
          We wish you the best of luck!
        </p>
      </div>

      <!-- Footer -->
      <div style="background-color: #f0f2f8; padding: 16px; text-align: center;">
        <p style="color: #888; font-size: 12px; margin: 0;">
          © ${new Date().getFullYear()} Alobha Technology Pvt. Ltd. | 
          <a href="https://alobhatechnologies.com" style="color: #4f46e5; text-decoration: none;">www.alobhahrms.com</a>
        </p>
      </div>

    </div>
  </div>
`;

await sendMail(loginEmail, '✅ Application Received – Alobha Technology', html);


      res.redirect('/candidates/success?name=' + encodeURIComponent(candidate.name));

    } catch (error) {
      console.error("Error saving candidate:", error.message);
      const jobs = await Job.findAll({ where: { status: 'Active' } });
      res.render('candidates/create', {
        jobs,
        candidate: req.body,
        selectedJobId: req.body.jobId || null,
        error: error.message || "Something went wrong while saving the candidate!",
        user: req.user || null
      });
    }
  }
];

//  LIST 
exports.listCandidates = async (req, res) => {
  try {
    const candidates = await Candidate.findAll({
      include: [
        { model: Job, as: 'job' },
        { model: Experience, as: 'Experiences' },
        { model: Qualification, as: 'Qualifications' },
        { model: Reference, as: 'References' },
        { model: Questionnaire, as: 'Questionnaire' }
      ]
    });



     res.render('candidates/list', { candidates, user: req.user || null });
  } catch (err) {
    console.error('Error fetching candidates:', err);
    res.status(500).send('Error fetching candidates');
  }
};







//  VIEW 
exports.viewCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findByPk(req.params.id, {
      include: [
        { model: Job, as: 'job' },
        { model: Qualification, as: 'Qualifications' },
        { model: Reference, as: 'References' },
        { model: Experience, as: 'Experiences' },
        { model: Questionnaire, as: 'Questionnaire' },
      ]
    });

    if (!candidate) return res.status(404).send('Candidate not found');

    let totalMonths = 0;
    if (candidate.Experiences && candidate.Experiences.length > 0) {
      candidate.Experiences.forEach(exp => {
        const from = exp.from ? new Date(exp.from) : null;
        const to = exp.to ? new Date(exp.to) : new Date();
        if (from) {
          const months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
          totalMonths += months;
        }
      });
    }
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    candidate.totalExperience = `${years} yrs ${months} mos`;

    candidate.documents = candidate.documents ? candidate.documents.split(',') : [];

    res.render('candidates/view', { candidate, user: req.user || null });
  } catch (err) {
    console.error('View Candidate Error:', err);
    res.status(500).send('Internal Server Error');
  }
};

//  DELETE 
exports.deleteCandidate = async (req, res) => {
  try {
    const candidateId = req.params.id;
    const candidate = await Candidate.findByPk(candidateId);
    if (!candidate) return res.status(404).send('Candidate not found');

    if (candidate.documents) {
      const files = candidate.documents.split(',');
      files.forEach(file => {
        const filePath = path.join(__dirname, '../uploads', file);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });
    }

    await Experience.destroy({ where: { candidateId } });
    await Qualification.destroy({ where: { candidateId } });
    await Reference.destroy({ where: { candidateId } });
    await Questionnaire.destroy({ where: { candidateId } });
    await Candidate.destroy({ where: { id: candidateId } });

    console.log(` Candidate ${candidate.name} deleted successfully`);
    res.redirect('/candidates/list');
  } catch (err) {
    console.error(' Error deleting candidate:', err);
    res.status(500).send('Internal Server Error');
  }
};

//EDIT 
exports.editCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findByPk(req.params.id, {
      include: ['Experiences', 'Qualifications', 'References', 'Questionnaire', 'job']
    });
    if (!candidate) return res.status(404).send('Candidate not found');

    res.render('candidates/edit', { candidate, error: null, user: req.user || null });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
};

// Update

exports.updateCandidate = async (req, res) => {
  const candidateId = req.params.id;
  try {
    const candidate = await Candidate.findByPk(candidateId);
    if (!candidate) return res.status(404).send('Candidate not found');

    const {
      name, email, contactNo, dob, age, maritalStatus,
      address, experienceYears, fresher,
      technicalSkills, strengths, achievements
    } = req.body;

    //  Candidate Basic Info 
    await candidate.update({
      name, email, contactNo, dob, age, maritalStatus,
      address, experienceYears, fresher: !!fresher
    });

    //  Documents 
    if (req.files && req.files.length > 0) {
      const newDocs = req.files.map(f => f.filename);
      const existingDocs = candidate.documents ? candidate.documents.split(',') : [];
      candidate.documents = [...existingDocs, ...newDocs].join(',');
      await candidate.save();
    }

    // ---------------- Experiences ----------------
    if (req.body.experiences) {
      const { id, company, designation, from, to, salary, reasonLeaving } = req.body.experiences;
      const expIds = ensureArray(id);
      const expCompanies = ensureArray(company);
      const expDesignations = ensureArray(designation);
      const expFroms = ensureArray(from);
      const expTos = ensureArray(to);
      const expSalaries = ensureArray(salary);
      const expReasons = ensureArray(reasonLeaving);

      for (let i = 0; i < expCompanies.length; i++) {
        if (expIds[i]) {
          await Experience.update({
            company: expCompanies[i],
            designation: expDesignations[i],
            from: expFroms[i] || null,
            to: expTos[i] || null,
            salary: expSalaries[i],
            reasonLeaving: expReasons[i]
          }, { where: { id: expIds[i] } });
        } else {
          await Experience.create({
            candidateId,
            company: expCompanies[i],
            designation: expDesignations[i],
            from: expFroms[i] || null,
            to: expTos[i] || null,
            salary: expSalaries[i],
            reasonLeaving: expReasons[i]
          });
        }
      }
    }

    //  Qualifications 
    if (req.body.qualifications) {
      const { id, course, board, year, division } = req.body.qualifications;
      const qualIds = ensureArray(id);
      const qualCourses = ensureArray(course);
      const qualBoards = ensureArray(board);
      const qualYears = ensureArray(year);
      const qualDivisions = ensureArray(division);

      for (let i = 0; i < qualCourses.length; i++) {
        if (qualIds[i]) {
          await Qualification.update({
            course: qualCourses[i],
            board: qualBoards[i],
            year: qualYears[i],
            division: qualDivisions[i]
          }, { where: { id: qualIds[i] } });
        } else {
          await Qualification.create({
            candidateId,
            course: qualCourses[i],
            board: qualBoards[i],
            year: qualYears[i],
            division: qualDivisions[i]
          });
        }
      }
    }

    //  References 
    if (req.body.references) {
      const { id, name, designation, company } = req.body.references;
      const refIds = ensureArray(id);
      const refNames = ensureArray(name);
      const refDesignations = ensureArray(designation);
      const refCompanies = ensureArray(company);

      for (let i = 0; i < refNames.length; i++) {
        if (refIds[i]) {
          await Reference.update({
            name: refNames[i],
            designation: refDesignations[i],
            company: refCompanies[i]
          }, { where: { id: refIds[i] } });
        } else {
          await Reference.create({
            candidateId,
            name: refNames[i],
            designation: refDesignations[i],
            company: refCompanies[i]
          });
        }
      }
    }

    // ---------------- Questionnaire ----------------
    const [questionnaire] = await Questionnaire.findOrCreate({ where: { candidateId } });
    await questionnaire.update({
      keyTechnicalExpertise: technicalSkills,
      majorStrengths: strengths,
      majorAchievements: achievements
    });

    // Redirect to candidate view page
    res.redirect(`/candidates/view/${candidateId}`);

  } catch (err) {
    console.error(err);
    const candidate = await Candidate.findByPk(candidateId, {
      include: ['Experiences', 'Qualifications', 'References', 'Questionnaire', 'job']
    });
    res.render('candidates/edit', {
      candidate,
      error: 'Error updating candidate',
      user: req.user || null
    });
  }
};

//  Candidate Status Page Controller
exports.getStatusPage = async (req, res) => {
  try {
    const userEmail = req.user.email;
   

    const candidates = await Candidate.findAll({
      where: { userEmail: userEmail },
      include: [
        {
          model: Job,
          as: "job",
        },
        {
          model: Result,
          as: "results",
          include: [
            {
              model: Test,
              as: "Test", 
            },
            {
              model: Answer, 
              attributes: [],
            },
          ],
          attributes: {
            include: [
              //  Correct aggregate paths
              [
                Sequelize.fn("SUM", Sequelize.col("results->Answers.obtainedMarks")),
                "calculatedObtained",
              ],
              [
                Sequelize.fn("SUM", Sequelize.col("results->Answers.questionMarks")),
                "calculatedTotal",
              ],
            ],
          },
        },
      ],

      //  group fields to prevent duplicate rows in aggregation
      group: [
        "Candidate.id",
        "job.id",
        "results.id",
        "results->Test.id",
      ],

      order: [["updatedAt", "DESC"]],
      subQuery: false,
    });


    res.render("candidates/status", {
      candidates,
      user: req.user || null,
    });
  } catch (err) {
    console.error(" Error loading candidate status:", err);
    res.status(500).send("Server error");
  }
};







//  Recruiter Updates Candidate Status Controller
exports.updateCandidateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["Pending", "In Review", "Interview", "Selected", "Rejected"];

    if (!allowed.includes(status)) {
      return res.status(400).send("Invalid status");
    }

    const candidate = await Candidate.findByPk(req.params.id);
    if (!candidate) return res.status(404).send("Candidate not found");

    await candidate.update({ status });

    // Optional: Auto assign test when selected
    // if (status === "Selected") {
    //   await candidate.update({ testAssigned: true });
    // }

    res.redirect(`/jobs/${candidate.jobId}/applicants`);
  } catch (err) {
    console.error("🚨 Error updating candidate status:", err);
    res.status(500).send("Server error");
  }
};


