import mongoose from "mongoose";

// For each time control on a platform (rating + games played)
const ratingSchema = new mongoose.Schema(
  {
    rating: { type: Number, default: 1000 },
    gamesPlayed: { type: Number, default: 0 },
  },
  { _id: false }
);

const chessAccountsSchema = new mongoose.Schema({
  _id: false,
  chessCom: {
    username: { type: String, trim: true },
    ratings: {
      blitz: { type: Number, default: 0 },
      bullet: { type: Number, default: 0 },
      rapid: { type: Number, default: 0 },
    },
    lastSync: { type: Date }, // Last time Chess.com was synced
  },
  lichess: {
    username: { type: String, trim: true },
    ratings: {
      blitz: { type: Number, default: 0 },
      bullet: { type: Number, default: 0 },
      rapid: { type: Number, default: 0 },
    },
    lastSync: { type: Date }, // Last time Lichess was synced
  },
});

// Main User Schema
const userSchema = new mongoose.Schema({
  fireBaseUID: { type: String, required: true, unique: true }, // Firebase Auth UID
  username: { type: String, required: true }, // College-registered name
  email: { type: String, required: true, unique: true }, // Any email (as new 1st year students may not have college email)
  collegeMail: { type: String, required: true, unique: true }, // College email ID
  branch: { type: String, required: true }, // e.g., CSE, CSE-DS, etc.
  year: { type: Number, required: true, min: 1, max: 5 }, // 5th for super-seniors

  role: {
    type: String,
    enum: ["knight", "champion", "wizard", "admin"],
    default: "knight",
  },

  coins: { type: Number, default: 0 }, // Personal treasury
  totalCoinsEarned: { type: Number, default: 0 }, // Lifetime coins earned
  treasuryDebt: { type: Number, default: 0 }, // Royal treasury debt
  chessAccounts: { type: chessAccountsSchema, default: {} }, // Linked chess accounts

  // Unified rating across platforms calculated by the algorithm
  calculatedElo: {
    blitz: { type: Number, default: 1000 },
    bullet: { type: Number, default: 1000 },
    rapid: { type: Number, default: 1000 },
    lastCalculated: { type: Date, default: Date.now },
  },

  title: { type: String, default: "Novice" }, // Club title or rank
  achievements: [String], // Achievement IDs / tags
  profilePicture: {
    type: String,
    required: false,
    default: "https://i.ibb.co/pvTYyRcm/default-Profile.webp", // default profile picture, in case image is not extracted from firebase login/signup
  },
  bio: { type: String, maxlength: 300 },

  isOnboardingComplete: { type: Boolean, default: false }, // Flag to check if onboarding is complete
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("User", userSchema);
