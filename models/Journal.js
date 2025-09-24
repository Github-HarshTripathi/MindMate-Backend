// models/Journal.js
import mongoose from 'mongoose';

const journalSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
  mood: {
    type: String,
    default: "Neutral",
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

const Journal = mongoose.model('Journal', journalSchema);

export default Journal;
