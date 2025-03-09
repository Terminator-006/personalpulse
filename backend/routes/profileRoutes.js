// routes/profileRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    createProfile,
    getProfiles,
    getProfile,
    updateProfile,
    deleteProfile,
    getProfileStats
} = require('../controllers/profileController');

router.post('/', protect, createProfile);
router.get('/', protect, getProfiles);
router.get('/:id', protect, getProfile);
router.put('/:id', protect, updateProfile);
router.delete('/:id', protect, deleteProfile);
router.get('/:id/stats', protect, getProfileStats);

module.exports = router;