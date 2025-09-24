// routes/moodRoutes.js
import express from 'express';
import Mood from '../models/Mood.js';

const router = express.Router();

// POST: Save a new mood
router.post('/', async (req, res) => {
  try {
    const { mood } = req.body;
    const newMood = new Mood({ mood });
    await newMood.save();
    res.status(201).json(newMood);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET: Fetch all moods
router.get('/', async (req, res) => {
  try {
    const moods = await Mood.find().sort({ date: -1 });
    res.status(200).json(moods);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
