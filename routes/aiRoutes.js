// routes/aiRoutes.js
import express from 'express';
import axios from 'axios';

const router = express.Router();

router.post('/chat', async (req, res, next) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const API_KEY = process.env.OPENROUTER_API_KEY;
    
    if (!API_KEY) {
      console.error('❌ OpenRouter API key is missing');
      return res.status(500).json({ error: 'AI service configuration error' });
    }

    console.log("🔑 Using OpenRouter API Key:", API_KEY.substring(0, 8) + "...");

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-3.5-turbo",
        messages: [{ role: "user", content: message }],
        max_tokens: 1000
      },
      {
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://mind-mate-frontend-lime.vercel.app",
          "X-Title": "MindMate"
        },
        timeout: 30000
      }
    );

    const aiResponse = response.data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      return res.status(500).json({ error: 'Invalid response from AI service' });
    }

    res.json({ response: aiResponse });
  } catch (error) {
    console.error('🔴 OpenRouter API Error:', error.message);
    
    // Better error handling
    if (error.response?.status === 401) {
      return res.status(500).json({ error: 'Invalid API key configuration' });
    }
    if (error.response?.status === 429) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    }
    
    next({
      status: error.response?.status || 500,
      message: process.env.NODE_ENV === 'development'
        ? `AI Service Error: ${error.message}`
        : 'AI service is currently unavailable. Please try again later.'
    });
  }
});

export default router;