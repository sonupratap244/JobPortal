const express = require('express');
const router = express.Router();
const db = require('../models');
const Course = db.Course;

// List
router.get('/', async(req,res)=>{
  const courses = await Course.findAll();
  res.render('courses',{courses});
});

// Create
router.get('/create', (req, res) => {
  res.render('users/createCourse', { errors: {}, name: '' });
});

router.post('/create', async (req, res) => {
  const { name } = req.body;
  const errors = {};

  // Validation
  if (!name) errors.name = "Course name is required";

  if (Object.keys(errors).length > 0) {
    return res.render('createCourse', { errors, name });
  }

  try {
    // Find missing ID or max+1
    const courses = await Course.findAll({ attributes: ['id'], order: [['id', 'ASC']] });
    let newId = 1;

    for (let i = 0; i < courses.length; i++) {
      if (courses[i].id !== i + 1) {
        newId = i + 1;
        break;
      }
      newId = courses.length + 1;
    }

    await Course.create({ id: newId, name });
    res.redirect('/courses');

  } catch (err) {
    res.render('createCourse', {
      errors: { general: err.message },
      name
    });
  }
});


// Edit
router.get('/edit/:id', async(req,res)=>{
  const course = await Course.findByPk(req.params.id);
  res.render('users/editCourse',{course,errors:[]});
});
router.post('/edit/:id', async(req,res)=>{
  try{
    const course = await Course.findByPk(req.params.id);
    course.name = req.body.name;
    await course.save();
    res.redirect('/courses');
  } catch(err){
    const messages = err.errors ? err.errors.map(e=>e.message) : [err.message];
    const course = await Course.findByPk(req.params.id);
    res.render('editCourse',{course,errors:messages});
  }
});

// Delete
router.post('/delete/:id', async(req,res)=>{
  await Course.destroy({where:{id:req.params.id}});
  res.redirect('/courses');
});

module.exports = router;
