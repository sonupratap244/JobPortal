const jwt = require('jsonwebtoken');
const db = require('../models');
const User = db.User;

//  Auth Check 
exports.authMiddleware = async (req, res, next) => {
  const token = req.cookies.jwt;
  if (!token) return res.redirect('/auth/login');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user) return res.redirect('/auth/login');

    req.user = user; // attach user 
    next();
  } catch (err) {
    console.error('Auth Error:', err);
    return res.redirect('/auth/login');
  }
};

//   Admin Access
exports.adminMiddleware = (req, res, next) => {
  if (!req.user) return res.redirect('/auth/login');
  if (req.user.role !== 'admin') return res.redirect('/auth/login'); 
  next();
};

//   User Access
exports.userMiddleware = (req, res, next) => {
  if (!req.user) return res.redirect('/auth/login');
  if (req.user.role !== 'user') return res.redirect('/auth/login'); 
  next();
};
