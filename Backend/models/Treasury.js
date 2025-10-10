import mongoose from "mongoose";

// Treasury Schema
// Maintains the royal treasury balance and logs how coins move.

const treasurySchema = new mongoose.Schema(
  {
    balance: { type: Number, default: 100000 }, // starting balance

    transactions: [
      {
        type: {
          type: String,
          enum: ["entryFee", "reward", "adjustment"],
          required: true,
        },
        username: { type: String },
        eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
        amount: { type: Number, required: true },
        direction: { type: String, enum: ["credit", "debit"], required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Treasury", treasurySchema);
