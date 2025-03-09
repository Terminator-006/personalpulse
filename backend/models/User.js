// const mongoose = require("mongoose");

// const UserSchema = new mongoose.Schema({
//   name: String,
//   email: { type: String, unique: true },
//   password: String,
// });

// module.exports = mongoose.model("User", UserSchema);



const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  settings: {
    notifications: {
      type: Boolean,
      default: true
    },
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    privacyPreferences: {
      shareInsights: {
        type: Boolean,
        default: false
      },
      allowAnalytics: {
        type: Boolean,
        default: true
      }
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  },
  accountStatus: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  pulseCredits: {
    type: Number,
    default: 5  // Initial free credits
  }
}, {
  timestamps: true
});

// Add method to check pulse credits
UserSchema.methods.hasSufficientCredits = function () {
  return this.pulseCredits > 0;
};

// Add method to deduct pulse credits
UserSchema.methods.deductCredits = function (amount = 1) {
  this.pulseCredits -= amount;
  return this.save();
};

module.exports = mongoose.model("User", UserSchema);