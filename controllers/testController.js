const { Test, Question, Result,Answer,sequelize,Assignment } = require("../models");

// Show form to create a new test
exports.createTestForm = (req, res) => {
  res.render("recruiter/createTest", { user: req.user || null });
};

// Create test 
exports.createTest = async (req, res) => {
  try {
    const { title, description, totalMarks, passingMarks, durationMinutes } = req.body;

    const test = await Test.create({
      title,
      description,
      totalMarks,
      passingMarks,
      durationMinutes,
      createdBy: 1, 
    });

    res.redirect(`/recruiter/test/${test.id}/add-questions`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating test");
  }
};

// Show add question 
exports.addQuestionsForm = async (req, res) => {
  try {
    const test = await Test.findByPk(req.params.id, { include: [Question] });
    res.render("recruiter/addQuestions", { test, user: req.user || null });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading test questions");
  }
};

// Add questions 
exports.addQuestion = async (req, res) => {
  try {
    const { testId, text, type, optionA, optionB, optionC, optionD, correctAnswer, marks, timeLimit } = req.body;

    if (!testId || !text) {
      return res.status(400).send("Missing test ID or question text");
    }

    const texts = Array.isArray(text) ? text : [text];
    const types = Array.isArray(type) ? type : [type];
    const optionsA = Array.isArray(optionA) ? optionA : [optionA];
    const optionsB = Array.isArray(optionB) ? optionB : [optionB];
    const optionsC = Array.isArray(optionC) ? optionC : [optionC];
    const optionsD = Array.isArray(optionD) ? optionD : [optionD];
    const answers = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer];
    const marksArr = Array.isArray(marks) ? marks : [marks];
    const times = Array.isArray(timeLimit) ? timeLimit : [timeLimit];

    for (let i = 0; i < texts.length; i++) {
      const qType = types[i] || "Objective";

      let options = null;
      let correctAns = null;

      if (qType === "Objective") {
        options = {
          A: optionsA[i] || "",
          B: optionsB[i] || "",
          C: optionsC[i] || "",
          D: optionsD[i] || ""
        };
        correctAns = answers[i];
      }

      await Question.create({
        testId,
        text: texts[i],
        type: qType,
        options,
        correctAnswer: correctAns,
        marks: marksArr[i] || 1,
        timeLimit: times[i] || 30
      });
    }

    res.redirect(`/recruiter/test/${testId}/add-questions?uploadSuccess=1`);
  } catch (err) {
    console.error(" Error adding questions:", err);
    res.status(500).send("Error adding questions");
  }
};


// Edit question
exports.editQuestionForm = async (req, res) => {
  try {
    const { testId, questionId } = req.params;
    const test = await Test.findByPk(testId);
    const question = await Question.findByPk(questionId);

    if (!test || !question) {
      return res.status(404).send("Test or Question not found");
    }

    // Ensure options are parsed from string
    if (typeof question.options === "string" && question.options) {
      question.options = JSON.parse(question.options);
    }

    res.render("recruiter/editQuestion", {
      test,
      question,
      user: req.user || null,
    });
  } catch (err) {
    console.error(" Error loading question edit form:", err);
    res.status(500).send("Error loading question edit form");
  }
};

// Update Question
exports.updateQuestion = async (req, res) => {
  try {
    const { testId, questionId } = req.params;
    const {
      text,
      optionA,
      optionB,
      optionC,
      optionD,
      correctAnswer,
      type,
      marks,
      timeLimit,
    } = req.body;

    const question = await Question.findByPk(questionId);
    if (!question) {
      return res.status(404).send("Question not found");
    }

    //  For Subjective, no options/correctAnswer are needed
    let optionsData = null;
    let correct = null;

    if (type === "Objective") {
      optionsData = {
        A: optionA || "",
        B: optionB || "",
        C: optionC || "",
        D: optionD || "",
      };
      correct = correctAnswer || "";
    }

    await question.update({
      text,
      type,
      options: optionsData,
      correctAnswer: correct,
      marks,
      timeLimit: timeLimit || 30,
    });

    res.redirect(`/recruiter/test/${testId}/add-questions`);
  } catch (err) {
    console.error(" Error updating question:", err);
    res.status(500).send("Error updating question");
  }
};


// Delete question

exports.deleteQuestion = async (req, res) => {
  try {
    const { testId, questionId } = req.params;

    // Check if question exists
    const question = await Question.findByPk(questionId);
    if (!question) {
      return res.status(404).send("Question not found");
    }

    // First delete all related answers
    await Answer.destroy({
      where: { questionId: questionId },
    });

    //  Then delete the question itself
    await question.destroy();

    //  Redirect back to add-questions page
    res.redirect(`/recruiter/test/${testId}/add-questions`);
  } catch (err) {
    console.error("Error deleting question:", err);
    res.status(500).send("Error deleting question");
  }
};


// List all tests
exports.listTests = async (req, res) => {
  try {
    const tests = await Test.findAll();
    res.render("recruiter/tests", { tests, user: req.user || null });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching tests");
  }
};

// Edit test form
exports.editTestForm = async (req, res) => {
  try {
    const test = await Test.findByPk(req.params.id);
    if (!test) return res.status(404).send("Test not found");

    res.render("recruiter/editTest", { test, user: req.user || null });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading test");
  }
};

// Update test
exports.updateTest = async (req, res) => {
  try {
    const { title, description, totalMarks, passingMarks, durationMinutes } = req.body;
    const test = await Test.findByPk(req.params.id);
    if (!test) return res.status(404).send("Test not found");

    await test.update({ title, description, totalMarks, passingMarks, durationMinutes });
    res.redirect("/recruiter/tests");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating test");
  }
};

// Delete test
exports.deleteTest = async (req, res) => {
  try {
    const testId = req.params.id;

    // 1 Delete Answers linked to this test's Results
    await Answer.destroy({
      where: {
        resultId: sequelize.literal(
          `(SELECT id FROM Results WHERE testId = ${testId})`
        )
      }
    });

    // 2 Delete Results of this test
    await Result.destroy({ where: { testId } });

    // 3 Delete Questions of this test
    await Question.destroy({ where: { testId } });

    await Assignment.destroy({ where: { testId } });
    // 4 Finally, delete the Test itself
    await Test.destroy({ where: { id: testId } });

    
    res.redirect("/recruiter/tests");
  } catch (err) {
    console.error(" Error deleting test:", err);
    res.status(500).send("Error deleting test");
  }
};



// Candidate Review Test
exports.reviewTest = async (req, res) => {
  try {
    const test = await Test.findByPk(req.params.testId, { include: [Question] });
    if (!test) return res.status(404).send("Test not found");

    // Parse options safely
    test.Questions.forEach((q) => {
      if (typeof q.options === "string") {
        try {
          q.options = JSON.parse(q.options);
        } catch {
          q.options = {};
        }
      }
    });

    res.render("recruiter/reviewTest", { test, user: req.user || null });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading candidate test");
  }
};

//  view Result



// recruiterController.js

exports.viewTestResults = async (req, res) => {
  try {
    const { testId } = req.params;

    const test = await Test.findByPk(testId, {
      include: [{ model: Question }],
    });
    if (!test) return res.status(404).send("Test not found");

    const results = await Result.findAll({
      where: { testId },
      include: [
        {
          model: Answer,
          include: [{ model: Question }],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const formattedResults = results.map((r) => {
      const answers = (r.Answers || []).map((a) => {
        const q = a.Question || {};
        return {
          id: a.id,
          question: q.text || "N/A",
          questionType:
            q.type?.toLowerCase() === "subjective" ? "Subjective" : "Objective",
          questionMarks: q.marks || 0,
          givenAnswer: a.givenAnswer || "—",
          correctAnswer: q.correctAnswer || "—",
          obtainedMarks: a.obtainedMarks || 0,
          isCorrect:
            q.type?.toLowerCase() === "objective" &&
            a.givenAnswer?.trim()?.toLowerCase() ===
              q.correctAnswer?.trim()?.toLowerCase(),
        };
      });

      return {
        id: r.id,
        candidateName: r.candidateName,
        obtainedMarks: r.obtainedMarks || 0,
        totalMarks: r.totalMarks || test.Questions.reduce((sum, q) => sum + (q.marks || 0), 0),
        status: r.status,
        reviewStatus: r.reviewStatus || "Pending",
        createdAt: r.createdAt,
        answers,
      };
    });



    res.render("recruiter/testResults", {
      test,
      results: formattedResults,
      user: req.user || null,
      success: req.query.success || null,
    });
  } catch (err) {
    console.error(" Error in viewTestResults:", err);
    res.status(500).send("Error fetching test results");
  }
};




exports.updateSubjectiveMarks = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const resultId = req.params.id;

    // Fetch result + test details
    const result = await Result.findByPk(resultId, { transaction: t });
    if (!result) {
      await t.rollback();
      return res.status(404).send("Result not found");
    }

    const test = await Test.findByPk(result.testId, { transaction: t });
    if (!test) {
      await t.rollback();
      return res.status(404).send("Test not found");
    }

    // Extract marks from form 
    const marksData = Object.entries(req.body)
      .filter(([key]) => key.startsWith("marks_"))
      .map(([key, value]) => ({
        answerId: key.split("_")[1],
        obtainedMarks: parseFloat(value) || 0,
      }));

    if (!marksData.length) {
      await t.rollback();
      return res.status(400).send("No subjective marks provided.");
    }

    // Update each
    for (const m of marksData) {
      await Answer.update(
        { obtainedMarks: m.obtainedMarks },
        { where: { id: m.answerId, resultId }, transaction: t }
      );
    }

    // Recalculate total obtainedMarks from all answers
    const total = await Answer.sum("obtainedMarks", {
      where: { resultId },
      transaction: t,
    });

    //  Get totalMarks
    const totalMarks = await Answer.sum("questionMarks", {
      where: { resultId },
      transaction: t,
    });

    // Determine Pass / Fail using passingMarks
    const status = total >= (test.passingMarks || 0) ? "Pass" : "Fail";

    // Update result
    await result.update(
      {
        obtainedMarks: total,
        totalMarks,
        reviewStatus: "Reviewed",
        status,
      },
      { transaction: t }
    );

    // Commit the transaction
    await t.commit();

    // Redirect with success message
    res.redirect(`/recruiter/test/${result.testId}/results?success=1`);
  } catch (err) {
    console.error(" Error updating subjective marks:", err);
    await t.rollback();
    res.status(500).send("Error updating subjective marks.");
  }
};













