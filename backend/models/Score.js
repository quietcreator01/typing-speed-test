const mongoose = require("mongoose");

const scoreSchema = new mongoose.Schema({
  username: { type: String, required: true },
  wpm: { type: Number, required: true },
  accuracy: { type: Number, required: true },
  difficulty: { type: String, enum: ["easy", "medium", "hard"], required: true },
  mode: { type: String, enum: ["timed", "passage"], required: true },
  updatedAt: { type: Date, default: Date.now }
});

// one score document per user per difficulty+mode combo
scoreSchema.index({ username: 1, difficulty: 1, mode: 1 }, { unique: true });

module.exports = mongoose.model("Score", scoreSchema);