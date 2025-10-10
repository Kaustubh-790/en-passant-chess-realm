import mongoose from "mongoose";

/**
 * Participant Schema
 * Stores every participant of an event — both registered and unregistered.
 * - fireBaseUID is optional — its presence indicates the user is registered on the club website.
 * - Used for coin system (entry fees, rewards, debts) only if fireBaseUID exists.
 */
const participantSchema = new mongoose.Schema({
  fireBaseUID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  }, // optional: registered user link
  username: { type: String, required: true }, // online username or offline name
  platform: {
    type: String,
    enum: ["chesscom", "lichess", "offline"],
    default: "offline",
  },
  rank: { type: Number },
  coinsEarned: { type: Number, default: 0 }, // updated after event result processing
});

/**
 * Online Event Schema
 * For Chess.com or Lichess-based events.
 * arenaLink: external link to the arena
 * autoSync: enables automatic participant & standings fetching from API
 */
const onlineEventSchema = new mongoose.Schema({
  platform: { type: String, enum: ["chesscom", "lichess"], required: true },
  arenaLink: { type: String, required: true },
  standingsFetched: { type: Boolean, default: false },
  autoSync: { type: Boolean, default: false },
  entryFee: { type: Number, default: 0 }, // coin-based entry fee (for display)
});

/**
 * Offline Event Schema
 * For tournaments held over the board.
 * Includes registration window and optional entry fee.
 */
const offlineEventSchema = new mongoose.Schema({
  venue: { type: String, required: true },
  registrationOpen: { type: Date, required: true },
  registrationClose: { type: Date, required: true },
  entryFee: { type: Number, default: 0 }, // coin-based entry fee (for display)
});

/**
 * Event Schema
 * Parent schema that unifies both online and offline events.
 * Contains participant info, mode, rewards, and distribution flags.
 */
const eventSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // event name
    description: { type: String },
    bannerImage: { type: String }, // optional banner image url
    mode: { type: String, enum: ["online", "offline"], required: true },
    category: {
      type: String,
      enum: ["past", "present", "future"],
      default: "future",
    },
    startDate: { type: Date, required: true }, // start date-time (time can be formatted)
    endDate: { type: Date, required: true },

    // Coin reward template — can be customized per event
    coinsReward: {
      first: { type: Number, default: 1200 },
      second: { type: Number, default: 1000 },
      third: { type: Number, default: 800 },
      participation: { type: Number, default: 500 },
    },

    onlineDetails: onlineEventSchema,
    offlineDetails: offlineEventSchema,

    // Stores all participants (registered + unregistered)
    participants: [participantSchema],
    distributed: { type: Boolean, default: false }, // flag for reward distribution
  },
  { timestamps: true }
);

/**
 * Auto-categorize events based on start and end dates.
 * Automatically sets category: 'future', 'present', or 'past'.
 */
eventSchema.pre("save", function (next) {
  const now = new Date();
  if (this.startDate > now) this.category = "future";
  else if (this.endDate < now) this.category = "past";
  else this.category = "present";
  next();
});

export default mongoose.model("Event", eventSchema);
