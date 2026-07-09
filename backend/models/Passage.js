const mongoose = require("mongoose");

const passageSchema = new mongoose.Schema({
  text: { type: String, required: true },
  difficulty: { type: String, enum: ["easy", "medium", "hard"], required: true }
});

module.exports = mongoose.model("Passage", passageSchema);