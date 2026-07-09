const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const Player = require("../models/Player");
const Score = require("../models/Score");

router.post("/", async (req, res) => {
  try {
    const { username, password, wpm, accuracy, difficulty, mode } = req.body;
    if (!username || !password || wpm == null || accuracy == null || !difficulty || !mode) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    let player = await Player.findOne({ username });

    if (!player) {
      const passwordHash = await bcrypt.hash(password, 10);
      player = await Player.create({ username, passwordHash });
    } else {
      const match = await bcrypt.compare(password, player.passwordHash);
      if (!match) {
        return res.status(401).json({ error: "Incorrect password for this username" });
      }
    }

    const existing = await Score.findOne({ username, difficulty, mode });

    if (!existing) {
      await Score.create({ username, wpm, accuracy, difficulty, mode });
      return res.status(201).json({ message: "Score saved" });
    }

    if (wpm > existing.wpm) {
      existing.wpm = wpm;
      existing.accuracy = accuracy;
      existing.updatedAt = new Date();
      await existing.save();
      return res.json({ message: "New best score saved" });
    }

    res.json({ message: "Score not higher than existing best, not updated" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/top", async (req, res) => {
  try {
    const { difficulty, mode } = req.query;
    const filter = {};
    if (difficulty) filter.difficulty = difficulty;
    if (mode) filter.mode = mode;
    const scores = await Score.find(filter).sort({ wpm: -1 }).limit(10);
    res.json(scores);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/mine", async (req, res) => {
  try {
    const { username, difficulty, mode } = req.query;
    if (!username || !difficulty || !mode) {
      return res.status(400).json({ error: "Missing username, difficulty, or mode" });
    }
    const score = await Score.findOne({ username, difficulty, mode });
    res.json({ wpm: score ? score.wpm : 0 });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;