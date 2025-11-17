const express = require("express");
const candidateRoutes = require("./candidateRoutes");

const router = express.Router();

//  Mount candidate routes under /api/candidates
router.use("/candidates", candidateRoutes);

module.exports = router;
