const {sequelize, Question, Test } = require('../models');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { v4: uuidv4 } = require('uuid');


// Show all tests
exports.manageQuestions = async (req, res) => {
  try {
    const tests = await Test.findAll({
      include: [
        {
          model: Question,
          as: 'questions',
          include: [{ model: Option, as: 'options' }]
        }
      ],
      order: [
        ['id', 'ASC'],
        [{ model: Question, as: 'questions' }, 'id', 'ASC']
      ]
    });

    res.render('questions/manage', { tests, user: req.user });
  } catch (err) {
    console.error('Error fetching tests and questions:', err);
    res.status(500).send('Server Error');
  }
};


// Show create question form
exports.createForm = async (req, res) => {
  const testId = req.params.testId;
  res.render('questions/create', { testId, user: req.user });
};

// Create a new question
exports.createQuestion = async (req, res) => {
  try {
    const { testId, text, marks } = req.body;
    await Question.create({ testId, text, marks });
    res.redirect('/questions/manage');
  } catch (err) {
    console.error('Error creating question:', err);
    res.status(500).send('Server Error');
  }
};

// Show edit form for a question
exports.editForm = async (req, res) => {
  try {
    const questionId = req.params.id;
    const question = await Question.findByPk(questionId);
    if (!question) return res.status(404).send('Question not found');

    res.render('questions/edit', { question, user: req.user });
  } catch (err) {
    console.error('Error loading edit form:', err);
    res.status(500).send('Server Error');
  }
};

// Update question details
exports.updateQuestion = async (req, res) => {
  try {
    const questionId = req.params.id;
    const { text, marks } = req.body;

    const question = await Question.findByPk(questionId);
    if (!question) return res.status(404).send('Question not found');

    question.text = text;
    question.marks = marks;
    await question.save();

    res.redirect('/questions/manage');
  } catch (err) {
    console.error('Error updating question:', err);
    res.status(500).send('Server Error');
  }
};

// Delete a question
exports.deleteQuestion = async (req, res) => {
  try {
    await Question.destroy({ where: { id: req.params.id } });
    res.redirect('/questions/manage');
  } catch (err) {
    console.error('Error deleting question:', err);
    res.status(500).send('Server Error');
  }
};

// View full question paper for a test
exports.viewQuestionPaper = async (req, res) => {
  try {
    const testId = req.params.testId;
    const test = await Test.findByPk(testId, {
      include: [{ model: Question, as: 'questions' }]
    });

    if (!test) return res.status(404).send('Test not found');

    res.render('questions/viewPaper', { test, user: req.user });
  } catch (err) {
    console.error('Error loading question paper:', err);
    res.status(500).send('Server Error');
  }
};




// Flexible value getter
function getCell(row, ...keys) {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null && String(row[k]).toString().trim() !== '') {
      return String(row[k]).toString().trim();
    }
  }
  return '';
}

//Validate a parsed row (returns array of error messages)
function validateRowObject(row, rowNum) {
  const errors = [];

  const qText = getCell(row, 'Question Text', 'Question', 'question');
  const optA = getCell(row, 'Option A', 'OptionA', 'A', 'a');
  const optB = getCell(row, 'Option B', 'OptionB', 'B', 'b');
  const optC = getCell(row, 'Option C', 'OptionC', 'C', 'c');
  const optD = getCell(row, 'Option D', 'OptionD', 'D', 'd');
  const correct = getCell(row, 'Correct Answer', 'Correct', 'Answer', 'answer').toUpperCase();
  const marksRaw = getCell(row, 'Marks', 'Score', 'marks') || '';
  const timeRaw = getCell(row, 'Time Limit', 'Time', 'timeLimit', 'TimeLimit') || '';
  const type = getCell(row, 'Type', 'Question Type', 'type') || ''; // 👈 New column for type support

  if (!qText) errors.push('Question Text missing');

  //  Determine if it's subjective automatically (if no options)
  const isSubjective = type.toLowerCase() === 'subjective' || (!optA && !optB && !optC && !optD);

  //  Validate based on question type
  if (!isSubjective) {
    if (!optA) errors.push('Option A missing');
    if (!optB) errors.push('Option B missing');
    if (!optC) errors.push('Option C missing');
    if (!optD) errors.push('Option D missing');

    if (!['A', 'B', 'C', 'D'].includes(correct)) errors.push('Correct Answer must be A/B/C/D');
  }

  const marks = parseInt(marksRaw, 10);
  if (isNaN(marks) || marks <= 0) errors.push('Marks must be a positive number');

  const timeLimit = parseInt(timeRaw, 10);
  if (isNaN(timeLimit) || timeLimit <= 0) errors.push('Time Limit must be a positive number (seconds)');

  return {
    errors,
    normalized: {
      text: qText,
      type: isSubjective ? 'Subjective' : 'Objective',
      optionA: optA,
      optionB: optB,
      optionC: optC,
      optionD: optD,
      correct: isSubjective ? null : correct,
      marks: isNaN(marks) ? 1 : marks,
      timeLimit: isNaN(timeLimit) ? 30 : timeLimit,
    },
  };
}

//  Upload preview
exports.uploadPreview = async (req, res) => {
  try {
    if (!req.file) return res.status(400).send('No file uploaded');

    const filePath = req.file.path;
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (!rawRows || rawRows.length === 0) {
      try { fs.unlinkSync(filePath); } catch (e) {}
      return res.status(400).send('Excel file is empty');
    }

    const parsedRows = rawRows.map((r, i) => {
      const { errors, normalized } = validateRowObject(r, i + 2);
      return {
        rowNumber: i + 2,
        raw: r,
        errors,
        data: normalized,
      };
    });

    const tempId = uuidv4();
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    const tempFile = path.join(uploadsDir, `parsed_${tempId}.json`);
    fs.writeFileSync(
      tempFile,
      JSON.stringify({ testId: req.body.testId || null, parsedRows }, null, 2),
      'utf8'
    );

    try { fs.unlinkSync(filePath); } catch (e) {}

    return res.render('questions/reviewUpload', {
      tempFileName: path.basename(tempFile),
      parsedRows,
      testId: req.body.testId || null,
      user: req.user,
    });
  } catch (err) {
    console.error('uploadPreview error:', err);
    return res.status(500).send('Failed to process Excel file');
  }
};

//  Confirm upload — handles both Objective & Subjective
exports.confirmUpload = async (req, res) => {
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  const { tempFileName } = req.body;
  if (!tempFileName) return res.status(400).send('Missing temp file name');

  const tempFile = path.join(uploadsDir, tempFileName);
  if (!fs.existsSync(tempFile)) return res.status(400).send('Temp file not found or expired');

  try {
    const payload = JSON.parse(fs.readFileSync(tempFile, 'utf8'));
    const parsedRows = payload.parsedRows || [];
    const testId = payload.testId || req.body.testId || null;

    const summary = { total: parsedRows.length, inserted: 0, skipped: 0, errors: [] };

    await sequelize.transaction(async (t) => {
      for (const row of parsedRows) {
        if (row.errors && row.errors.length > 0) {
          summary.skipped++;
          summary.errors.push({ rowNumber: row.rowNumber, errors: row.errors });
          continue;
        }

        const d = row.data;

        await Question.create(
          {
            testId,
            text: d.text,
            marks: d.marks,
            timeLimit: d.timeLimit,
            type: d.type,
            correctAnswer: d.correct,
            options: d.type === 'Objective'
              ? { A: d.optionA, B: d.optionB, C: d.optionC, D: d.optionD }
              : null,
          },
          { transaction: t }
        );

        summary.inserted++;
      }
    });

    try { fs.unlinkSync(tempFile); } catch (e) {}

    return res.redirect(`/recruiter/test/${testId}/add-questions?uploadSuccess=1`);
  } catch (err) {
    console.error('confirmUpload error:', err);
    try { fs.unlinkSync(tempFile); } catch (e) {}
    return res.status(500).send('Failed to save uploaded questions');
  }
};

