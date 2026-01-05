import express from "express";
import User from "../models/User.js";
import { admin } from "../middleware/adminMiddleware.js";

const router = express.Router();

// get all users
router.get("/users", admin, async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json({ success: true, users });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

export default router;
