import express from 'express';
import axios from 'axios';
import { errorHandler } from '../middleware/errorHandler.js';

const router = express.Router();

router.post('/chat', async (req, res, next) => {
  try {
    const { message } = req.body;
    const API_KEY = process.env.OPENAI_API_KEY;
    
    if (!API_KEY) {
      throw new Error('OpenAI API key is missing');
    }

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: message }],
      },
      {
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 30000
      }
    );

    res.json({ response: response.data.choices[0].message.content });
  } catch (error) {
    next(error);
  }
});

export default router;