import admin from "../config/firebase.js";
import User from "../models/User.js";
import jwt, { decode } from "jsonwebtoken";
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
    const { idToken, additionalData } = req.body;

    // verifying the firebase id token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name } = decodedToken;

    // check if user exists in db
    let user = await User.findOne({ fireBaseUID: uid });

    if (!user) {
      // New user registration
      const { branch, year } = additionalData;

      // additional field validation
      if (!branch || !year) {
        return res.status(400).json({
          success: false,
          message: "Branch and Year are required for new users",
        });
      }

      // check if email already exists
      const existingUser = await User.findOne({ email: email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email already registered",
        });
      }

      // create new user
      user = new User({
        fireBaseUID: uid,
        username: name,
        email,
        branch,
        year,
      });
    }

    // save user to db
    await user.save();

    // generate access tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // store hashed refresh token in db
    await storeRefreshToken(user._id, refreshToken);

    // return user data and tokens
    res.status(200).json({
      success: true,
      message:
        user.createdAt === user.updatedAt
          ? "Registration Successful"
          : "Login Successful",
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          branch: user.branch,
          year: user.year,
          role: user.role,
          coins: user.coins,
          profilePicture: user.profilePicture,
        },
        tokens: { accessToken, refreshToken },
      },
    });
  } catch (err) {
    console.error("Google Sign-In error", err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
};

export const refreshAccessToken = async (req, res) => {
  try {
    const { RefreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token required",
      });
    }

    // verify refresh token
    const decodedToken = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET
    );

    // Check if refresh token exists in database
    const storedToken = await RefreshToken.findOne({
      token: refreshToken,
      userId: decodedToken.userId,
      expiresAt: { $gt: new Date() },
    });

    if (!storedToken) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token",
      });
    }

    // generate new access token
    const newAccessToken = generateAccessToken(decodedToken.userId);
    const newRefreshToken = generateRefreshToken(decodedToken.userId);

    // store new refresh token
    await storeRefreshToken(decodedToken.userId, newRefreshToken);
    await RefreshToken.deleteOne({ _id: storedToken._id }); // delete old refresh token

    res.status(200).json({
      success: true,
      data: { accessToken: newAccessToken, refreshToken: newRefreshToken },
    });
  } catch (err) {
    console.error("Refresh token error", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token required" });
    } else {
      // delete refresh token from db
      await RefreshToken.deleteOne({ token: refreshToken });
    }
    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (err) {
    console.error("Logout error", err);
    res.status(500).json({
      success: false,
      message: "Logout failed",
      error: err.message,
    });
  }
};
