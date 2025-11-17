const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const db = require('../models');

const Task = db.Task;
const User = db.User;
const Course = db.Course;

//  List Tasks 
router.get('/', async (req, res) => {
  try {
    const { courseId, completed, page, limit } = req.query;

    const where = {};
    if (courseId) where.courseId = courseId;
    if (completed === 'true') where.isCompleted = true;
    if (completed === 'false') where.isCompleted = false;

    const currentPage = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 5;
    const offset = (currentPage - 1) * pageSize;

    const { count, rows: tasks } = await Task.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user' },
        { model: Course, as: 'course' }
      ],
      order: [['id', 'ASC']],
      limit: pageSize,
      offset
    });

    const totalPages = Math.ceil(count / pageSize);
    const courses = await Course.findAll();

    res.render('tasks', {
      tasks,
      courses,
      query: req.query,
      currentPage,
      totalPages
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

//  Create Task Form
router.get('/create', async (req, res) => {
  const users = await User.findAll();
  const courses = await Course.findAll();
  res.render('createTask', {
    errors: {},
    title: '',
    description: '',
    dueDate: '',
    userId: '',
    courseId: '',
    users,
    courses
  });
});

//  Create Task (manual ID fill)
router.post('/create', async (req, res) => {
  const { title, description, dueDate, userId, courseId } = req.body;
  const errors = {};

  if (!title) errors.title = "Title is required";
  if (!description) errors.description = "Description is required";
  if (!dueDate) errors.dueDate = "Due Date is required";
  if (!userId) errors.userId = "User selection is required";
  if (!courseId) errors.courseId = "Course selection is required";

  if (Object.keys(errors).length > 0) {
    const users = await User.findAll();
    const courses = await Course.findAll();
    return res.render('createTask', {
      errors,
      title,
      description,
      dueDate,
      userId,
      courseId,
      users,
      courses
    });
  }

  try {
    const tasks = await Task.findAll({ attributes: ['id'], order: [['id', 'ASC']] });
    let newId = 1;
    for (let i = 0; i < tasks.length; i++) {
      if (tasks[i].id !== i + 1) {
        newId = i + 1;
        break;
      }
      newId = tasks.length + 1;
    }

    await Task.create({ id: newId, title, description, dueDate, userId, courseId });
    res.redirect('/tasks');
  } catch (err) {
    const users = await User.findAll();
    const courses = await Course.findAll();
    res.render('createTask', {
      errors: { general: err.message },
      title,
      description,
      dueDate,
      userId,
      courseId,
      users,
      courses
    });
  }
});

//  Edit Task
router.get('/edit/:id', async (req, res) => {
  const task = await Task.findByPk(req.params.id);
  const users = await User.findAll();
  const courses = await Course.findAll();
  res.render('editTask', { task, errors: {}, users, courses });
});

router.post('/edit/:id', async (req, res) => {
  const { title, description, dueDate, userId, courseId, isCompleted } = req.body;
  try {
    const task = await Task.findByPk(req.params.id);
    task.title = title;
    task.description = description;
    task.dueDate = dueDate;
    task.userId = userId;
    task.courseId = courseId;
    task.isCompleted = isCompleted === 'on';
    await task.save();                                    
    res.redirect('/tasks');
  } catch (err) {
    const task = await Task.findByPk(req.params.id);
    const users = await User.findAll();
    const courses = await Course.findAll();
    res.render('editTask', { task, errors: { general: err.message }, users, courses });
  }
});
                    
//  Delete Task
router.post('/delete/:id', async (req, res) => {
  await Task.destroy({ where: { id: req.params.id } });
  res.redirect('/tasks');
});

module.exports = router;
