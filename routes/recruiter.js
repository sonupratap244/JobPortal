const express = require("express");
const router = express.Router();
const testController = require("../controllers/testController");
const { Test, Result,Answer,Candidate } = require("../models");

// Test routes
router.get("/tests/create", testController.createTestForm);
router.post("/tests/create", testController.createTest);

router.get("/test/:id/add-questions", testController.addQuestionsForm);
router.post("/test/:id/add-questions", testController.addQuestion);

router.get("/tests", testController.listTests);

// Edit & Update
router.get("/test/:id/edit", testController.editTestForm);
router.post("/test/:id/edit", testController.updateTest);

// edit & delet
router.get("/test/:testId/question/:questionId/edit", testController.editQuestionForm);
router.post("/test/:testId/question/:questionId/update", testController.updateQuestion);
router.post("/test/:testId/question/:questionId/delete", testController.deleteQuestion);


// Delete 
router.delete("/test/:id", testController.deleteTest);
router.delete("/test/:testId/question/:questionId", testController.deleteQuestion);
// View 
router.get("/test/:testId/review", testController.reviewTest);

router.get("/test/:testId/results", testController.viewTestResults);

router.get("/tests/:testId/results", async (req, res) => {
  try {
    const testId = req.params.testId;

    const test = await Test.findByPk(testId);
    if (!test) return res.status(404).send("Test not found");

    const results = await Result.findAll({
      where: { testId },
      order: [["createdAt", "DESC"]],
    });

    res.render("recruiter/testResults", {
      test,
      results,
      user: req.user || { name: "Recruiter" },
    });
  } catch (err) {
    console.error("Error fetching test results:", err);
    res.status(500).send("Internal Server Error");
  }
});


// router.post("/results/:resultId/delete", async (req, res) => {
//   try {
//     const resultId = req.params.resultId;

//     const result = await Result.findByPk(resultId);
//     if (!result) return res.status(404).send("Result not found");

  
//     await Answer.destroy({ where: { resultId } });

//     await result.destroy();

//     //  test results
//     res.redirect(`/recruiter/tests/${result.testId}/results`);
//   } catch (err) {
//     console.error("Error deleting result:", err);
//     res.status(500).send("Internal Server Error");
//   }
// });
router.post("/results/:resultId/delete", async (req, res) => {
  try {
    const resultId = req.params.resultId;

    //  Find the result
    const result = await Result.findByPk(resultId);
    if (!result) return res.status(404).send("Result not found");

    //  Delete related answers first
    await Answer.destroy({ where: { resultId } });

    //  Delete the result itself
    await Result.destroy({ where: { id: resultId } });

    //  Reset candidate's testAssigned to allow retake
    await Candidate.update(
      { testAssigned: null },
      { where: { id: result.candidateId } }
    );

    //  Redirect back to recruiter results page with success message
    res.redirect(`/recruiter/test/${result.testId}/results?success=deleted`);
  } catch (err) {
    console.error(" Error deleting result:", err);
    res.status(500).send("Internal Server Error");
  }
});





router.post("/results/:id/mark", testController.updateSubjectiveMarks);


module.exports = router;
