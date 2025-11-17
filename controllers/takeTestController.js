const {
  Candidate,
  Test,
  Question,
  Result,
  Answer,
  sequelize,
  Job,
} = require("../models");
const { Op } = require("sequelize");

//  List all tests
exports.listAvailableTests = async (req, res) => {
  try {
    if (!req.user || !req.user.email) {
      return res.status(401).send("Unauthorized — please log in again");
    }

    const userEmail = req.user.email.trim().toLowerCase();

    //  Find candidate linked with this email (either via `email` or `userEmail`)
    const candidate = await Candidate.findOne({
      where: {
        [Op.or]: [{ email: userEmail }, { userEmail: userEmail }],
      },
      order: [["updatedAt", "DESC"]],
    });

    console.log(
      " [DEBUG] Candidate fetched:",
      candidate ? candidate.email : " NOT FOUND"
    );

    if (!candidate) {
      return res.render("candidate/tests", {
        tests: [],
        user: req.user,
        candidate: null,
        takenTestIds: [],
        title: "",
        error: "Candidate not found — please contact support.",
      });
    }

    //Determine test title from query (if given)
    const testTitleFromQuery = req.query.title
      ? decodeURIComponent(req.query.title)
      : null;

    // Fetch assigned test based on `testAssigned` field
    let tests = [];
    let title = "";

    if (candidate.testAssigned) {
      const assignedTest = await Test.findByPk(candidate.testAssigned);
      if (assignedTest) {
        // If title is given in query, verify match
        if (!testTitleFromQuery || assignedTest.title === testTitleFromQuery) {
          tests.push(assignedTest);
          title = assignedTest.title;
        }
      }
    }

    //  Get previously attempted tests
    const results = await Result.findAll({
      where: { candidateName: candidate.name },
    });

    const takenTestIds = results.map((r) => r.testId);

    // Render the page safely
    res.render("candidate/tests", {
      tests,
      user: req.user,
      candidate,
      takenTestIds,
      title,
      error:
        tests.length === 0 ? "No test assigned yet — please contact HR." : null,
    });
  } catch (err) {
    console.error(" [ERROR] listAvailableTests failed:", err);
    res.status(500).send("Error fetching tests");
  }
};

// Start Test
exports.startTest = async (req, res) => {
  try {
    const test = await Test.findByPk(req.params.id, {
      include: [{ model: Question }],
      order: [[{ model: Question }, "id", "ASC"]],
    });

    if (!test) return res.status(404).send("Test not found");

    // Format questions
    test.Questions.forEach((q) => {
      if (typeof q.options === "string") {
        try {
          q.options = JSON.parse(q.options);
        } catch (e) {
          console.error(` Error parsing options for Q${q.id}:`, e);
          q.options = {};
        }
      }
    });

    res.render("candidate/startTest", { test, user: req.user });
  } catch (err) {
    console.error(" Error loading test:", err);
    res.status(500).send("Error loading test");
  }
};

//submit test

exports.submitTest = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { testId } = req.body;

    if (!req.user || !req.user.email) {
      await t.rollback();
      return res.status(401).send("Unauthorized. Please log in first.");
    }

    // ✅ Step 1: Find the actual candidate record for the logged-in user
    const candidate = await Candidate.findOne({
      where: { email: req.user.email },
      transaction: t,
    });

    if (!candidate) {
      await t.rollback();
      return res.status(404).send("Candidate record not found for this user.");
    }

    const candidateId = candidate.id; // ✅ now correct candidate id
    const candidateName = candidate.name || req.user.name || "Candidate";

    // ✅ Step 2: Fetch the test with all questions
    const test = await Test.findByPk(testId, {
      include: [{ model: Question }],
      transaction: t,
    });

    if (!test) {
      await t.rollback();
      return res.status(404).send("Test not found.");
    }

    // ✅ Step 3: Prevent duplicate submissions
    const existingResult = await Result.findOne({
      where: { testId, candidateId },
      transaction: t,
    });

    if (existingResult) {
      await t.rollback();
      return res.status(400).send("You have already submitted this test.");
    }

    let obtainedMarks = 0;
    const answersData = [];
    let hasSubjective = false;

    // ✅ Step 4: Evaluate all questions
    for (const q of test.Questions) {
      const key = `question_${q.id}`;
      const givenAnswer = req.body[key]?.trim();

      if (!givenAnswer) {
        await t.rollback();
        return res
          .status(400)
          .send("Please attempt all questions before submitting.");
      }

      const qType = q.type?.toLowerCase() || "objective";

      const ansObj = {
        questionId: q.id,
        givenAnswer,
        isCorrect: null,
        obtainedMarks: 0,
        questionMarks: q.marks || 0,
      };

      if (qType === "objective") {
        const isCorrect =
          givenAnswer.toLowerCase() === q.correctAnswer?.trim().toLowerCase();
        ansObj.isCorrect = isCorrect;
        ansObj.obtainedMarks = isCorrect ? q.marks : 0;
        obtainedMarks += ansObj.obtainedMarks;
      } else {
        hasSubjective = true;
      }

      answersData.push(ansObj);
    }

    // ✅ Step 5: Calculate totals
    const totalMarks =
      test.totalMarks ||
      test.Questions.reduce((sum, q) => sum + (q.marks || 0), 0);
    const passingMarks = test.passingMarks || Math.floor(totalMarks / 2);

    const reviewStatus = hasSubjective ? "Pending" : "Reviewed";
    const status = obtainedMarks >= passingMarks ? "Pass" : "Fail";

    // ✅ Step 6: Save Result (correct candidateId)
    const result = await Result.create(
      {
        candidateId,
        candidateName,
        testId,
        obtainedMarks,
        totalMarks,
        status,
        reviewStatus,
      },
      { transaction: t }
    );

    // ✅ Step 7: Save each Answer
    for (const ans of answersData) {
      await Answer.create(
        {
          resultId: result.id,
          questionId: ans.questionId,
          givenAnswer: ans.givenAnswer,
          isCorrect: ans.isCorrect,
          obtainedMarks: ans.obtainedMarks,
          questionMarks: ans.questionMarks,
        },
        { transaction: t }
      );
    }

    await t.commit();

    // ✅ Step 8: Show success page
    return res.render("candidate/thankyou", {
      user: req.user,
      result,
      redirectUrl: "/status",
    });
  } catch (err) {
    console.error("🚨 Error submitting test:", err);
    if (!t.finished) await t.rollback();
    res.status(500).send("Error submitting test.");
  }
};

//  candidate's results

exports.viewResults = async (req, res) => {
  try {
    //  Ensure candidate is logged in
    if (!req.user || !req.user.id) {
      return res.status(401).send("Unauthorized");
    }

    //  Fetch all results for this candidate
    const results = await Result.findAll({
      where: { candidateId: req.user.id, reviewStatus: { [Op.ne]: "Deleted" } }, // ignore deleted
      include: [
        {
          model: Test,
          attributes: ["id", "title", "totalMarks", "passingMarks"],
        },
        {
          model: Candidate,

          attributes: ["id", "name", "email"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    //  Ensure subjective marks are reflected immediately

    const formattedResults = results.map((r) => ({
      id: r.id,
      title: r.Test?.title || "Untitled Test",
      totalMarks: r.Test?.totalMarks || 0,
      passingMarks: r.Test?.passingMarks || 0,
      obtainedMarks: r.obtainedMarks || 0,
      status: r.status || "Pending",
      reviewStatus: r.reviewStatus || "Pending",
      createdAt: r.createdAt,
      candidateName: r.Candidate?.name || "Unknown Candidate", // add candidate info
      candidateEmail: r.Candidate?.email || "N/A",
    }));

    res.render("candidate/resultsHistory", {
      results: formattedResults,
      user: req.user,
      pageTitle: "My Test Results",
    });
  } catch (err) {
    console.error(" Error loading results:", err);
    res.status(500).send("Error loading results history");
  }
};

exports.viewResultDetail = async (req, res) => {
  try {
    if (!req.user?.email) {
      return res.status(401).send("Unauthorized");
    }

    //  Get Candidate
    const candidate = await Candidate.findOne({
      where: { email: req.user.email },
      attributes: ["id", "name", "email"],
    });

    if (!candidate) {
      console.log(" Candidate not found for email:", req.user.email);
      return res.status(404).send("Candidate not found");
    }

    console.log(" Candidate Found:", candidate.id, candidate.name);

    //  Load Result with related data
    const result = await Result.findOne({
      where: { id: req.params.id, candidateId: candidate.id },
      include: [
        {
          model: Test,
          as: "Test",
          include: [{ model: Question }],
        },
        {
          model: Answer,
          include: [{ model: Question }],
        },
      ],
    });

    if (!result) {
      console.log(` Result not found for ID: ${req.params.id}`);
      return res.status(404).send("Result not found");
    }

    //  Calculate stats
    const totalQuestions = result.Test?.Questions?.length || 0;
    const attemptedCount = result.Answers?.length || 0;
    const notAttemptedCount = totalQuestions - attemptedCount;

    console.log(" Result Loaded:", {
      id: result.id,
      testTitle: result.Test?.title,
      answersCount: result.Answers?.length,
    });

    //  Render Result Page
    res.render("candidate/resultDetail", {
      result,
      test: result.Test,
      user: req.user,
      attemptedCount,
      notAttemptedCount,
      totalQuestions,
      pageTitle: `Result: ${result.Test?.title || "Test"}`,
    });
  } catch (err) {
    console.error(" Error loading result detail:", err);
    res.status(500).send("Error loading detailed result");
  }
};
