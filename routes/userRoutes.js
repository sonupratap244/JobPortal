const express = require('express');
const router = express.Router();
const db = require('../models');
const User = db.User;

// List Users
router.get('/', async (req, res) => {
  try {
    const users = await User.findAll({ order: [['id', 'ASC']] });
    res.render('users/listUsers', { users });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Create User Form
router.get('/create', (req, res) => {
  res.render('users/createUser', { errors: {}, name: '', email: '' });
});

// Create User POST
router.post('/create', async (req, res) => {
  const { name, email } = req.body;
  const errors = {};

  if (!name) errors.name = "Name is required";
  if (!email) errors.email = "Email is required";

  if (Object.keys(errors).length > 0) {
    return res.render('users/createUser', { errors, name, email });
  }

  try {
    // Manual ID fill logic
    const users = await User.findAll({ attributes: ['id'], order: [['id', 'ASC']] });
    let newId = 1;

    for (let i = 0; i < users.length; i++) {
      if (users[i].id !== i + 1) {
        newId = i + 1;
        break;
      }
      newId = users.length + 1;
    }

    await User.create({ id: newId, name, email });
    res.redirect('/users');
  } catch (err) {
    res.render('users/createUser', {
      errors: { general: err.message },
      name,
      email
    });
  }
});

// Edit User Form
router.get('/edit/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.redirect('/users');
    res.render('users/editUser', { user, errors: {} });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Edit User POST
router.post('/edit/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.redirect('/users');

    const errors = {};
    const { name, email } = req.body;
    if (!name) errors.name = "Name is required";
    if (!email) errors.email = "Email is required";

    if (Object.keys(errors).length > 0) {
      return res.render('users/editUser', { user, errors });
    }

    user.name = name;
    user.email = email;
    await user.save();
    res.redirect('/users');
  } catch (err) {
    const user = await User.findByPk(req.params.id);
    const messages = err.errors ? err.errors.map(e => e.message) : [err.message];
    res.render('users/editUser', { user, errors: messages });
  }
});

// Delete User
router.post('/delete/:id', async (req, res) => {
  try {
    await User.destroy({ where: { id: req.params.id } });
    res.redirect('/users');
  } catch (err) {
    res.status(500).send(err.message);
  }
});






module.exports = router;
