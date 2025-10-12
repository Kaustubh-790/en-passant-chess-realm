import mongoose from "mongoose";
import User from "../models/User.js";

const MONGO_URI = "mongodb://localhost:27017/En-passant";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

//  Dummy User Data
const dummyUser = {
  fireBaseUID: "dummy-firebase-uid-12345",
  username: "Kaustubh Sharma",
  email: "kaustubh@example.com",
  collegeMail: "kaustubh@college.edu",
  branch: "CSE",
  year: 2,
  role: "knight",
  coins: 500,
  totalCoinsEarned: 1000,
  treasuryDebt: 0,
  chessAccounts: {
    chessCom: {
      username: "random_user_chesscom",
      ratings: {
        blitz: 0,
        bullet: 0,
        rapid: 0,
      },
    },
    lichess: {
      username: "random_user_lichess",
      ratings: {
        blitz: 0,
        bullet: 0,
        rapid: 0,
      },
    },
  },
  calculatedElo: {
    blitz: 1000,
    bullet: 1000,
    rapid: 1000,
  },
  title: "Novice",
  achievements: [],
  profilePicture: "",
  bio: "Testing dummy user for API",
};

//  Create Dummy User
async function createDummy() {
  try {
    const existing = await User.findOne({ fireBaseUID: dummyUser.fireBaseUID });
    if (existing) {
      console.log("Dummy user already exists:", existing._id);
      return process.exit();
    }

    const user = await User.create(dummyUser);
    console.log("Dummy user created with ID:", user._id);
    process.exit();
  } catch (err) {
    console.error("Error creating dummy user:", err);
    process.exit(1);
  }
}

createDummy();
