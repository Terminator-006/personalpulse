// controllers/profileController.js
const Profile = require('../models/Profile');
const Interaction = require('../models/Interaction');
const mongoose = require('mongoose');

// Create new profile
exports.createProfile = async (req, res) => {
    try {
        const { name, category, notes } = req.body;

        // Validation
        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Name is required"
            });
        }

        // Check if profile with same name exists for this user
        const existingProfile = await Profile.findOne({
            userId: req.user._id,
            name: name
        });

        if (existingProfile) {
            return res.status(400).json({
                success: false,
                message: "Profile with this name already exists"
            });
        }

        const profile = await Profile.create({
            userId: req.user._id,
            name,
            category: category || 'other',
            notes
        });

        res.status(201).json({
            success: true,
            message: "Profile created successfully",
            data: profile
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error creating profile",
            error: error.message
        });
    }
};

// Get all profiles for a user
exports.getProfiles = async (req, res) => {
    try {
        const { category, search, sort = 'name' } = req.query;

        // Build query
        let query = { userId: req.user._id };
        
        // Add category filter if provided
        if (category) {
            query.category = category;
        }

        // Add search filter if provided
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        // Build sort object
        let sortObj = {};
        if (sort === 'recent') {
            sortObj = { createdAt: -1 };
        } else if (sort === 'name') {
            sortObj = { name: 1 };
        }

        const profiles = await Profile.find(query)
            .sort(sortObj)
            .lean();

        // Get interaction counts for each profile
        const profilesWithStats = await Promise.all(profiles.map(async (profile) => {
            const interactionCount = await Interaction.countDocuments({
                profileId: profile._id
            });

            const recentInteraction = await Interaction.findOne({
                profileId: profile._id
            })
            .sort({ date: -1 })
            .select('date description sentiment');

            return {
                ...profile,
                stats: {
                    interactionCount,
                    lastInteraction: recentInteraction
                }
            };
        }));

        res.json({
            success: true,
            count: profilesWithStats.length,
            data: profilesWithStats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching profiles",
            error: error.message
        });
    }
};

// Get single profile by ID
exports.getProfile = async (req, res) => {
    try {
        const profileId = req.params.id;

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(profileId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid profile ID"
            });
        }

        const profile = await Profile.findOne({
            _id: profileId,
            userId: req.user._id
        });

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: "Profile not found"
            });
        }

        // Get profile statistics
        const stats = await Interaction.aggregate([
            { $match: { profileId: profile._id } },
            {
                $group: {
                    _id: null,
                    totalInteractions: { $sum: 1 },
                    averageSentiment: { $avg: '$sentiment.score' },
                    positiveInteractions: {
                        $sum: {
                            $cond: [{ $gt: ['$sentiment.score', 0] }, 1, 0]
                        }
                    },
                    negativeInteractions: {
                        $sum: {
                            $cond: [{ $lt: ['$sentiment.score', 0] }, 1, 0]
                        }
                    }
                }
            }
        ]);

        // Get recent interactions
        const recentInteractions = await Interaction.find({ profileId: profile._id })
            .sort({ date: -1 })
            .limit(5);

        res.json({
            success: true,
            data: {
                profile,
                stats: stats[0] || {
                    totalInteractions: 0,
                    averageSentiment: 0,
                    positiveInteractions: 0,
                    negativeInteractions: 0
                },
                recentInteractions
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching profile",
            error: error.message
        });
    }
};

// Update profile
exports.updateProfile = async (req, res) => {
    try {
        const profileId = req.params.id;
        const { name, category, notes } = req.body;

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(profileId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid profile ID"
            });
        }

        // Check if profile exists and belongs to user
        const profile = await Profile.findOne({
            _id: profileId,
            userId: req.user._id
        });

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: "Profile not found"
            });
        }

        // Check if new name conflicts with existing profile
        if (name && name !== profile.name) {
            const existingProfile = await Profile.findOne({
                userId: req.user._id,
                name,
                _id: { $ne: profileId }
            });

            if (existingProfile) {
                return res.status(400).json({
                    success: false,
                    message: "Profile with this name already exists"
                });
            }
        }

        // Update profile
        const updatedProfile = await Profile.findByIdAndUpdate(
            profileId,
            {
                $set: {
                    name: name || profile.name,
                    category: category || profile.category,
                    notes: notes || profile.notes
                }
            },
            { new: true }
        );

        res.json({
            success: true,
            message: "Profile updated successfully",
            data: updatedProfile
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error updating profile",
            error: error.message
        });
    }
};

// Delete profile
exports.deleteProfile = async (req, res) => {
    try {
        const profileId = req.params.id;

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(profileId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid profile ID"
            });
        }

        // Check if profile exists and belongs to user
        const profile = await Profile.findOne({
            _id: profileId,
            userId: req.user._id
        });

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: "Profile not found"
            });
        }

        // Start a session for transaction
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Delete profile
            await Profile.findByIdAndDelete(profileId).session(session);
            
            // Delete all associated interactions
            await Interaction.deleteMany({ profileId }).session(session);

            await session.commitTransaction();
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }

        res.json({
            success: true,
            message: "Profile and associated interactions deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error deleting profile",
            error: error.message
        });
    }
};

// Get profile statistics
exports.getProfileStats = async (req, res) => {
    try {
        const profileId = req.params.id;

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(profileId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid profile ID"
            });
        }

        const profile = await Profile.findOne({
            _id: profileId,
            userId: req.user._id
        });

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: "Profile not found"
            });
        }

        // Get comprehensive statistics
        const stats = await Interaction.aggregate([
            { $match: { profileId: profile._id } },
            {
                $group: {
                    _id: null,
                    totalInteractions: { $sum: 1 },
                    averageSentiment: { $avg: '$sentiment.score' },
                    positiveInteractions: {
                        $sum: {
                            $cond: [{ $gt: ['$sentiment.score', 0] }, 1, 0]
                        }
                    },
                    negativeInteractions: {
                        $sum: {
                            $cond: [{ $lt: ['$sentiment.score', 0] }, 1, 0]
                        }
                    },
                    neutralInteractions: {
                        $sum: {
                            $cond: [{ $eq: ['$sentiment.score', 0] }, 1, 0]
                        }
                    },
                    firstInteraction: { $min: '$date' },
                    lastInteraction: { $max: '$date' }
                }
            }
        ]);

        // Get interaction types distribution
        const typeDistribution = await Interaction.aggregate([
            { $match: { profileId: profile._id } },
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                profile,
                stats: stats[0] || {
                    totalInteractions: 0,
                    averageSentiment: 0,
                    positiveInteractions: 0,
                    negativeInteractions: 0,
                    neutralInteractions: 0,
                    firstInteraction: null,
                    lastInteraction: null
                },
                typeDistribution
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching profile statistics",
            error: error.message
        });
    }
};