// const jwt = require("jsonwebtoken");
// const User = require("../models/User");

// exports.protect = async (req, res, next) => {
//   let token;
//   if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
//     try {
//       token = req.headers.authorization.split(" ")[1];
//       const decoded = jwt.verify(token, process.env.JWT_SECRET);
//       req.user = await User.findById(decoded.userId).select("-password");
//       next();
//     } catch (error) {
//       return res.status(401).json({ message: "Unauthorized, invalid token" });
//     }
//   } else {
//     return res.status(401).json({ message: "Unauthorized, no token" });
//   }
// };


const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.protect = async (req, res, next) => {
  try {

    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        message: "Not authorized to access this route"
      });
    } 

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select("-password");

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      if (user.accountStatus !== 'active') {
        return res.status(403).json({ message: "Account is not active" });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({ message: "Token is invalid or expired" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error in auth middleware" });
  }
};

// // Add optional auth middleware for routes that can work with or without auth
// exports.optionalAuth = async (req, res, next) => {
//   try {
//     let token = req.headers.authorization?.split(" ")[1];
//     if (token) {
//       const decoded = jwt.verify(token, process.env.JWT_SECRET);
//       req.user = await User.findById(decoded.userId).select("-password");
//     }
//     next();
//   } catch (error) {
//     next();
//   }
// };