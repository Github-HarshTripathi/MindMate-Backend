import express from 'express';
import Journal from '../models/Journal.js';
import { validateJournalEntry } from '../middleware/validation.js';
import Sentiment from 'sentiment';

const router = express.Router();
const sentiment = new Sentiment();

// ✅ POST: Save a new journal entry with detected mood only
router.post('/', validateJournalEntry, async (req, res, next) => {
  try {
    const { content } = req.body;

    const analysis = sentiment.analyze(content);
    
    // ✅ Consistent mood scale
    let detectedMood = '😐 Neutral';
    if (analysis.score > 2) detectedMood = '😄 Positive';
    else if (analysis.score > 0) detectedMood = '🙂 Slightly Positive';
    else if (analysis.score < -2) detectedMood = '😢 Negative';
    else if (analysis.score < 0) detectedMood = '😞 Slightly Negative';

    const newEntry = new Journal({
      content,
      mood: detectedMood
    });

    await newEntry.save();
    res.status(201).json(newEntry);
  } catch (error) {
    next(error);
  }
});

// ✅ GET: All journal entries
router.get('/', async (req, res, next) => {
  try {
    const entries = await Journal.find().sort({ date: -1 });
    res.json(entries);
  } catch (error) {
    next(error);
  }
});

// ✅ POST: Analyze mood separately
router.post('/analyze', async (req, res, next) => {
  try {
    const { text } = req.body;
    const result = sentiment.analyze(text);

    let mood = '😐 Neutral';
    if (result.score > 2) mood = '😄 Positive';
    else if (result.score > 0) mood = '🙂 Slightly Positive';
    else if (result.score < -2) mood = '😢 Negative';
    else if (result.score < 0) mood = '😞 Slightly Negative';

    res.json({ mood, score: result.score });
  } catch (error) {
    next(error);
  }
});

// 🔍 GET by ID
router.get('/:id', async (req, res, next) => {
  try {
    const entry = await Journal.findById(req.params.id);
    if (!entry) return res.status(404).json({ error: 'Entry not found' });
    res.json(entry);
  } catch (error) {
    next(error);
  }
});

// ✏️ PUT: Update entry (e.g., after analysis)
router.put('/:id', async (req, res, next) => {
  try {
    const updatedEntry = await Journal.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedEntry) return res.status(404).json({ error: 'Entry not found' });
    res.json(updatedEntry);
  } catch (error) {
    next(error);
  }
});

// 🗑️ DELETE entry
router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await Journal.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Entry not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
