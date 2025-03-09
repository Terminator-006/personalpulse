// const User = require("../models/User");
// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");

// exports.register = async (req, res) => {
//   try {
//     const { name, email, password } = req.body;
//     if (!name || !email || !password) {
//       return res.status(400).json({ error: "All fields are required" });
//     }

//     const userExists = await User.findOne({ email });
//     if (userExists) {
//       return res.status(400).json({ error: "Email already in use" });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);
//     const user = await User.create({ name, email, password: hashedPassword });

//     res.status(201).json({ message: "User registered successfully", user });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// exports.login = async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     const user = await User.findOne({ email });

//     if (!user || !(await bcrypt.compare(password, user.password))) {
//       return res.status(401).json({ error: "Invalid credentials" });
//     }

//     const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
//     res.json({ message: "Login successful", token });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };




const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Cookie options
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Enhanced validation
    if (!name || !email || !password) {
      return res.status(400).json({ 
        error: "All fields are required",
        details: {
          name: !name ? "Name is required" : null,
          email: !email ? "Email is required" : null,
          password: !password ? "Password is required" : null
        }
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Password strength validation
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters long" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await User.create({ 
      name, 
      email, 
      password: hashedPassword,
      settings: {
        notifications: true,
        theme: 'light',
        privacyPreferences: {
          shareInsights: false,
          allowAnalytics: true
        }
      },
      pulseCredits: 5
    });

    // Generate token
    const token = generateToken(user._id);
    // Set cookie
    res.cookie('token', token, cookieOptions);

    res.status(201).json({ 
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        settings: user.settings,
        pulseCredits: user.pulseCredits
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (user.accountStatus !== 'active') {
      return res.status(403).json({ error: "Account is not active" });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);
    // Set cookie
    res.cookie('token', token, cookieOptions);

    res.json({ 
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        settings: user.settings,
        pulseCredits: user.pulseCredits
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.logout = async (req, res) => {
  try {
    // Clear the cookie
    res.cookie('token', '', {
      httpOnly: true,
      expires: new Date(0) // Expire immediately
    });

    res.json({ 
      success: true,
      message: "Logged out successfully" 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error during logout",
      error: error.message 
    });
  }
};

// In authController.js

exports.updatePassword = async (req, res) => {
  try {
      const { currentPassword, newPassword } = req.body;

      // Validation
      if (!currentPassword || !newPassword) {
          return res.status(400).json({
              error: "Both current password and new password are required"
          });
      }

      // Password strength validation
      if (newPassword.length < 8) {
          return res.status(400).json({
              error: "New password must be at least 8 characters long"
          });
      }

      const user = await User.findById(req.user._id);

      // Verify current password
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
          return res.status(401).json({
              error: "Current password is incorrect"
          });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;

      await user.save();

      res.json({
          message: "Password updated successfully"
      });
  } catch (error) {
      res.status(500).json({
          error: "Error updating password",
          message: error.message
      });
  }
};

exports.updateSettings = async (req, res) => {
  try {
      const { settings } = req.body;

      // Validation
      if (!settings) {
          return res.status(400).json({
              error: "Settings object is required"
          });
      }

      // Validate settings structure
      const validSettings = {
          notifications: typeof settings.notifications === 'boolean',
          theme: ['light', 'dark'].includes(settings.theme),
          privacyPreferences: settings.privacyPreferences && 
                            typeof settings.privacyPreferences === 'object'
      };

      if (!Object.values(validSettings).every(Boolean)) {
          return res.status(400).json({
              error: "Invalid settings format"
          });
      }

      const user = await User.findById(req.user._id);
      user.settings = {
          ...user.settings, // Keep existing settings
          ...settings      // Update with new settings
      };

      await user.save();

      res.json({
          message: "Settings updated successfully",
          settings: user.settings
      });
  } catch (error) {
      res.status(500).json({
          error: "Error updating settings",
          message: error.message
      });
  }
};

// Helper function to generate JWT
const generateToken = (userId) => {
  return jwt.sign(
    { userId }, 
    process.env.JWT_SECRET, 
    { expiresIn: "7d" }
  );
};