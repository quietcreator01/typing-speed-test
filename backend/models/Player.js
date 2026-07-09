const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, maxlength: 20 },
  passwordHash: { type: String, required: true }
});

module.exports = mongoose.model("Player", playerSchema);