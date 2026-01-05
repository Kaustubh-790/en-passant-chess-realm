import express from "express";
import {
  googleSignIn,
  refreshAccessToken,
  logout,
} from "../controllers/authController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { admin } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.post("/google-signin", googleSignIn);
router.post("/refresh-token", refreshAccessToken);
router.post("/logout", logout);

export default router;
