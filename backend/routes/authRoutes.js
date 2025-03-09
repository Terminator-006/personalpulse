// const express = require("express");
// const { register, login } = require("../controllers/authController");
// const router = express.Router();

// router.post("/register", register);
// router.post("/login", login);

// module.exports = router;



const express = require("express");
const { 
  register, 
  login, 
  logout,
  updatePassword,
  updateSettings 
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", protect, logout);
router.put("/password", protect, updatePassword);
router.put("/settings", protect, updateSettings);

module.exports = router;