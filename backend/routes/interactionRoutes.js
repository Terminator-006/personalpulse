// routes/interactionRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  addInteraction,
  getInteractions,
  getPulseMetrics
} = require('../controllers/interactionController');

router.post('/', protect, addInteraction);
router.get('/', protect, getInteractions);
router.get('/pulse', protect, getPulseMetrics);

module.exports = router;