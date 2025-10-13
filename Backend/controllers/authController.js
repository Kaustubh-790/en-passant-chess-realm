import admin from "../config/firebase.js";
import User from "../models/User.js";
import jwt, { decode } from "jsonwebtoken";
import bcrypt from "bcrypt";
import RefreshToken from "../models/RefreshToken.js";

// Generate access token
const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "15m" }); // 15 minutes
};

// Generate refresh token
const generateRefreshToken = (userId) => {
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
    let user = await User.findOne({ fireBaseUID: uid });

    if (!user) {
      // New user registration
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
        collegeMail: "dummyMail@abes.ac.in", // some freshers may not have mail so assigning dummy mail(since its a required field) that can be updated later
        branch: "CSE", // default feild as google login is used and branch and year are not fetched from google
        year: 1, // default feild as google login is used and branch and year are not fetched from google
        coins: 100, // signup bonus
      });
    }

    // save user to db
    await user.save();

    // generate access tokens
    const accessToken = await generateAccessToken(user._id);
    const refreshToken = await generateRefreshToken(user._id);

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
          collegeMail: user.collegeMail,
          branch: user.branch,
          year: user.year,
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
    const { refreshToken } = req.body;
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
    const storedTokens = await RefreshToken.find({
      userId: decodedToken.userId,
      expiresAt: { $gt: new Date() },
    });

    let storedToken = null;
    for (const token of storedTokens) {
      const isValid = await bcrypt.compare(refreshToken, token.token);
      if (isValid) {
        storedToken = token;
        break;
      }
    }

    if (!storedToken) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token",
      });
    }

    // generate new access token
    const newAccessToken = await generateAccessToken(decodedToken.userId);
    const newRefreshToken = await generateRefreshToken(decodedToken.userId);

    // store new refresh token
    await storeRefreshToken(decodedToken.userId, newRefreshToken);
    // delete old refresh token
    await RefreshToken.deleteOne({ _id: storedToken._id });

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
    }

    // Verify refresh token to obtain userId
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid refresh token" });
    }

    const userId = decoded.userId;
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid token payload" });
    }

    // delete matching refresh token from db
    const storedTokens = await RefreshToken.find({ userId });
    for (const token of storedTokens) {
      const isValid = await bcrypt.compare(refreshToken, token.token);
      if (isValid) {
        await RefreshToken.deleteOne({ _id: token._id });
        break;
      }
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
