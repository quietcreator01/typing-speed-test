const express = require("express");
const router = express.Router();
const Passage = require("../models/Passage");

router.get("/", async (req, res) => {
  try {
    const { difficulty } = req.query;
    if (!["easy", "medium", "hard"].includes(difficulty)) {
      return res.status(400).json({ error: "Invalid or missing difficulty" });
    }

    const count = await Passage.countDocuments({ difficulty });
    const randomIndex = Math.floor(Math.random() * count);
    const passage = await Passage.findOne({ difficulty }).skip(randomIndex);

    res.json({ text: passage.text });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;