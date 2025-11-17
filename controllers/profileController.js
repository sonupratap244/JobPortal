const db = require('../models');
const path = require('path');
const fs = require('fs');
const User = db.User;

exports.viewProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.redirect('/auth/login');
    res.render('profile', { user });
  } catch (err) {
    console.error('Profile View Error:', err);
    res.status(500).send('Error loading profile');
  }
};

exports.editProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.redirect('/auth/login');
    res.render('profileEdit', { user, errors: {} });
  } catch (err) {
    console.error('Edit Profile Error:', err);
    res.status(500).send('Error loading edit page');
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.redirect('/auth/login');

    const { name, email, phone } = req.body;
    if (!name || !email) {
      return res.render('profileEdit', {
        user,
        errors: { message: 'Name and Email are required' }
      });
    }

    // Handle old photo delete and new upload
    if (req.file) {
      if (user.photo) {
        const oldPath = path.join(__dirname, '../uploads', user.photo);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      user.photo = req.file.filename;
    }

    user.name = name;
    user.email = email;
    user.phone = phone;
    await user.save();

    res.redirect('/profile');
  } catch (err) {
    console.error('Update Profile Error:', err);
    res.status(500).send('Error updating profile');
  }
};
