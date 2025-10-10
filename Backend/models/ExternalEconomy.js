import mongoose from "mongoose";

// ExternalEconomy Schema
// Records all financial activity for players who participated in events but are not registered on the website yet
const externalEconomySchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    username: { type: String, required: true },
    platform: { type: String, enum: ["chesscom", "lichess"], required: true },

    entryFee: { type: Number, default: 0 },
    reward: { type: Number, default: 0 },
    netBalance: { type: Number, default: 0 }, // reward - entryFee

    isCleared: { type: Boolean, default: false },
    linkedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("ExternalEconomy", externalEconomySchema);
