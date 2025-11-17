const express = require('express');
const router = express.Router();
const passport = require('passport');
const db = require('../models');
const User = db.User;
const { Candidate, Job } = require('../models');
const { Op } = require('sequelize');
const { hashPassword, comparePassword, generateToken } = require('../utils/auth');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Import middleware
const { authMiddleware, adminMiddleware, userMiddleware } = require('../middlewares/authMiddleware.js');

//  LOGIN 
router.get('/login', (req, res) => res.render('login', { errors: [] }));

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });

    if (!user || !user.password) return res.render('login', { errors: ['Invalid Email'] });

    const valid = await comparePassword(password, user.password);
    if (!valid) return res.render('login', { errors: ['Invalid Password'] });

    const token = generateToken(user);
    res.cookie('jwt', token, { httpOnly: true });

    // Role-based redirect
    if (user.role === 'admin') return res.redirect('/home');
    return res.redirect('/auth/profile');
  } catch (err) {
    console.error('Login error:', err);
    res.render('login', { errors: ['Something went wrong'] });
  }
});

//  REGISTER 
router.get('/register', (req, res) => res.render('register', { errors: [] }));

router.post('/register', async (req, res) => {
  const { name, email, phone, password } = req.body;
  const errors = [];

  if (!name) errors.push('Name required');
  if (!email) errors.push('Email required');
  if (!phone) errors.push('Mobile number required');
  if (!password) errors.push('Password required');
  if (phone && phone.length !== 10) errors.push('Mobile number must be 10 digits');

  if (errors.length > 0) return res.render('register', { errors });

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.render('register', { errors: ['Email already registered'] });

    const hash = await hashPassword(password);
    const user = await User.create({ name, email, phone, password: hash, role: 'user' });

    const token = generateToken(user);
    res.cookie('jwt', token, { httpOnly: true });
    res.redirect('/auth/profile');
  } catch (err) {
    console.error('Register error:', err);
    res.render('register', { errors: [err.message] });
  }
});

//  LOGOUT 
router.get('/logout', (req, res) => {
  res.clearCookie('jwt');
  res.redirect('/auth/login');
});

//  GOOGLE OAUTH 
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/auth/login' }),
  (req, res) => {
    const token = generateToken(req.user);
    res.cookie('jwt', token, { httpOnly: true });

    if (req.user.role === 'admin') return res.redirect('/home');
    return res.redirect('/auth/profile');
  }
);

// ======================= FORGOT PASSWORD =======================
router.get('/forgot-password', (req, res) =>
  res.render('auth/forgot-password', { error: null, success: null })
);

router.post('/forgot-password', async (req, res) => {
  const { identifier } = req.body;
  try {
    let user;
    if (identifier.includes('@')) {
      user = await User.findOne({ where: { email: identifier } });
    } else {
      user = await User.findOne({ where: { phone: identifier } });
    }

    if (!user) return res.render('auth/forgot-password', { error: 'User not found', success: null });

    const token = crypto.randomBytes(32).toString('hex');
    user.resetToken = token;
    user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
    await user.save();

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    const resetLink = `${process.env.FRONTEND_URL}/auth/reset-password/${token}`;
    await transporter.sendMail({
      from: `"Alobha Technologies" <${process.env.SMTP_FROM}>`,
      to: user.email,
      subject: 'Password Reset Request',
      html: `<p>You requested a password reset.</p><p>Click <a href="${resetLink}">here</a> to reset your password.</p>`,
    });

    res.render('auth/forgot-password', { success: 'Reset email sent, check your inbox.', error: null });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.render('auth/forgot-password', { error: 'Something went wrong', success: null });
  }
});

// ======================= RESET PASSWORD =======================
router.get('/reset-password/:token', async (req, res) => {
  try {
    const token = req.params.token;
    const user = await User.findOne({
      where: { resetToken: token, resetTokenExpiry: { [Op.gt]: Date.now() } },
    });

    if (!user) return res.send('Token invalid or expired');
    res.render('auth/reset-password', { token, error: null });
  } catch (err) {
    console.error('Reset GET error:', err);
    res.send('Error occurred');
  }
});

router.post('/reset-password/:token', async (req, res) => {
  const { password } = req.body;
  const token = req.params.token;

  try {
    const user = await User.findOne({
      where: { resetToken: token, resetTokenExpiry: { [Op.gt]: Date.now() } },
    });

    if (!user) return res.send('Token invalid or expired');

    user.password = await hashPassword(password);
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    res.redirect('/auth/login');
  } catch (err) {
    console.error('Reset POST error:', err);
    res.send('Something went wrong');
  }
});

// ======================= ADMIN DASHBOARD =======================
router.get('/home', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const totalCandidates = await Candidate.count();
    const freshers = await Candidate.count({ where: { experience: 0 } });
    const totalJobs = await Job.count();
    const activeUsers = await User.count({ where: { isActive: true } });

    res.render('home', { user: req.user, totalCandidates, freshers, totalJobs, activeUsers });
  } catch (err) {
    console.error('Home route error:', err);
    res.render('home', { user: req.user, totalCandidates: 0, freshers: 0, totalJobs: 0, activeUsers: 0 });
  }
});

// ======================= USER PROFILE =======================
router.get('/profile', authMiddleware, userMiddleware, async (req, res) => {
  try {
    res.render('profile', { user: req.user });
  } catch (err) {
    console.error('Profile route error:', err);
    res.render('profile', { user: req.user, error: 'Could not load profile' });
  }
});


const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${timestamp}-${file.originalname}`);
  }
});
const upload = multer({ storage });

// Upload photo
router.post('/profile/upload-photo', authMiddleware, upload.single('photo'), async (req, res) => {
  try {
    const user = req.user;

    // Delete old photo if exists
    if(user.photo) {
      const oldPath = path.join(__dirname, '../uploads', user.photo);
      if(fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    // Save new photo
    user.photo = req.file.filename;
    await user.save();

    res.json({ success: true, filename: req.file.filename });
  } catch(err) {
    console.error(err);
    res.json({ success: false });
  }
});

router.post('/profile/remove-photo', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    if(user.photo) {
      const filePath = path.join(__dirname, '../uploads', user.photo);
      if(fs.existsSync(filePath)) fs.unlinkSync(filePath);
      user.photo = null;
      await user.save();
    }
    res.json({ success: true });
  } catch(err) {
    console.error(err);
    res.json({ success: false });
  }
});



module.exports = router;
