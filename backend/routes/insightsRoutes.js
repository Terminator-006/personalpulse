const express = require("express");
const { analyzeConversation } = require("../controllers/insightsController");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();

// Protected route - only authenticated users can analyze text
router.post("/analyze", protect, analyzeConversation);

module.exports = router;