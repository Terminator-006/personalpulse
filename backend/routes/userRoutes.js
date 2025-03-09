// const express = require("express");
// const { getUserProfile, updateUserProfile } = require("../controllers/userController");
// const { protect } = require("../middleware/authMiddleware");

// const router = express.Router();

// router.get("/profile", protect, getUserProfile);
// router.put("/profile", protect, updateUserProfile);

// module.exports = router;


// routes/userRoutes.js
const express = require("express");
const { 
  getUserProfile, 
  updateUserProfile,
  deleteUserProfile,
  getUserStats,
  updateUserPreferences
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();

// Basic profile routes
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);
router.delete("/profile", protect, deleteUserProfile);

// Additional user-related routes
router.get("/stats", protect, getUserStats);
router.put("/preferences", protect, updateUserPreferences);

module.exports = router;