// const User = require("../models/User");

// // Get user profile
// exports.getUserProfile = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id).select("-password");
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }
//     res.json(user);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // Update user profile
// exports.updateUserProfile = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id);
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     user.name = req.body.name || user.name;
//     user.email = req.body.email || user.email;

//     if (req.body.password) {
//       const bcrypt = require("bcryptjs");
//       user.password = await bcrypt.hash(req.body.password, 10);
//     }

//     const updatedUser = await user.save();
//     res.json({ message: "Profile updated", user: updatedUser });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };


// controllers/userController.js
const User = require("../models/User");
const bcrypt = require("bcryptjs");

// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .lean();

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          settings: user.settings,
          pulseCredits: user.pulseCredits,
          accountStatus: user.accountStatus,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error retrieving profile",
      error: error.message 
    });
  }
};

// Update user profile
exports.updateUserProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    
    // Input validation
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Invalid email format"
        });
      }

      // Check if email is already in use by another user
      const existingUser = await User.findOne({ email, _id: { $ne: req.user._id } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email already in use"
        });
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          name: name || req.user.name,
          email: email || req.user.email,
        }
      },
      { new: true }
    ).select("-password");

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: { user: updatedUser }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating profile",
      error: error.message
    });
  }
};

// Delete user profile
exports.deleteUserProfile = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    
    // Clear authentication cookie
    res.cookie('token', '', {
      httpOnly: true,
      expires: new Date(0)
    });

    res.json({
      success: true,
      message: "Profile deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting profile",
      error: error.message
    });
  }
};

// Get user stats
exports.getUserStats = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    
    // You can add more stats calculations here
    const stats = {
      pulseCredits: user.pulseCredits,
      accountAge: Math.floor((Date.now() - user.createdAt) / (1000 * 60 * 60 * 24)), // in days
      lastLogin: user.lastLogin,
      accountStatus: user.accountStatus
    };

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving user stats",
      error: error.message
    });
  }
};

// Update user preferences
exports.updateUserPreferences = async (req, res) => {
  try {
    const { notifications, theme, privacyPreferences } = req.body;

    // Validate theme
    if (theme && !['light', 'dark'].includes(theme)) {
      return res.status(400).json({
        success: false,
        message: "Invalid theme value"
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          'settings.notifications': notifications !== undefined ? notifications : req.user.settings.notifications,
          'settings.theme': theme || req.user.settings.theme,
          'settings.privacyPreferences': privacyPreferences || req.user.settings.privacyPreferences
        }
      },
      { new: true }
    ).select("-password");

    res.json({
      success: true,
      message: "Preferences updated successfully",
      data: { settings: updatedUser.settings }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating preferences",
      error: error.message
    });
  }
};