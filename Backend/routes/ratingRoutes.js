import express from "express";
import { updateChessRatings } from "../controllers/ratingController.js";

const router = express.Router();
router.post("/update", updateChessRatings);

export default router;
