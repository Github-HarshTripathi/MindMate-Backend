// models/Mood.js
import mongoose from 'mongoose';

const moodSchema = new mongoose.Schema({
  mood: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

const Mood = mongoose.model('Mood', moodSchema);

export default Mood;
