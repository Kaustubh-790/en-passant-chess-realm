import admin from "../config/firebase.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt.js";
import RefreshToken from "../models/RefreshToken.js";

// Generate access token
const generateAccessToken = (user) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "15m" }); // 15 minutes
};

// Generate refresh token
const generateRefreshToken = async (user) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d", // 7 days
  });
};

// Store refresh token with hash in DB
const storeRefreshToken = async (userId, token) => {
  const saltRounds = 10;

  try {
    const hashedToken = await bcrypt.hash(token, saltRounds);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days expiry

    await RefreshToken.create({
      userId,
      token: hashedToken,
      expiresAt,
    });
    console.log("Refresh token stored successfully for user:", userId);
  } catch (error) {
    console.error("Error storing refresh token:", error);
  }
};

export const googleSignIn = async (req, res) => {
  try {
    const { idToken } = req.body;

    // verifying the firebase id token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name } = decodedToken;

    // check if user exists in db
  } catch (err) {
    console.error(err);
  }
};
