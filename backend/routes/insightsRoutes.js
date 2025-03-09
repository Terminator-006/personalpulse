const express = require("express");
const { analyzeConversation } = require("../controllers/insightsController");
const router = express.Router();

router.post("/analyze", analyzeConversation);

module.exports = router;
