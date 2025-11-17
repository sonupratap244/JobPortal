const express = require("express");
const router = express.Router();
const takeTestController = require("../controllers/takeTestController");
const { authMiddleware } = require("../middlewares/authMiddleware");

// List available tests
router.get("/tests", authMiddleware, takeTestController.listAvailableTests);

// Start a test
router.get("/test/:id/start", authMiddleware, takeTestController.startTest);

// Submit test
router.post("/test/submit", authMiddleware, takeTestController.submitTest);

// View all results
router.get("/results", authMiddleware, takeTestController.viewResults);

// View single result
router.get("/results/:id", authMiddleware, takeTestController.viewResultDetail);

module.exports = router;
