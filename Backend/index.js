import express from "express";
import mongoose from "mongoose";
import ratingRoutes from "./routes/ratingRoutes.js";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/En-passant";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("Successfully connected to MongoDB."))
  .catch((err) => console.error("Connection error", err));

app.get("/", (req, res) => {
  res.send("Server is running.");
});
app.use("/api/ratings", ratingRoutes);
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.listen(PORT, () => {
  console.log(`Server is listening on http://localhost:${PORT}`);
});
