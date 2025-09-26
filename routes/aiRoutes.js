import express from 'express';
import axios from 'axios';
const router = express.Router();

// Enhanced error handling for AI routes
router.post('/chat', async (req, res, next) => {
  try {
    const { message } = req.body;
    
    // Validate input
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Message is required and cannot be empty' 
      });
    }

    const API_KEY = process.env.OPENROUTER_API_KEY;
    
    if (!API_KEY) {
      console.error('❌ OpenRouter API key missing');
      return res.status(500).json({ 
        success: false, 
        error: 'AI service configuration error' 
      });
    }

    console.log('🤖 Processing AI request:', { 
      messageLength: message.length,
      timestamp: new Date().toISOString() 
    });

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-3.5-turbo",
        messages: [{ role: "user", content: message.trim() }],
        max_tokens: 500,
        temperature: 0.7,
      },
      {
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://mind-mate-frontend-lime.vercel.app",
          "X-Title": "MindMate"
        },
        timeout: 25000 // 25 seconds timeout
      }
    );

    console.log('✅ AI response received');
    
    const aiResponse = response.data.choices?.[0]?.message?.content;
    
    if (!aiResponse) {
      return res.status(500).json({ 
        success: false, 
        error: 'Invalid response format from AI service' 
      });
    }

    res.json({ 
      success: true,
      response: aiResponse 
    });
    
  } catch (error) {
    console.error('❌ AI Route Error:', {
      error: error.message,
      code: error.code,
      responseStatus: error.response?.status,
      responseData: error.response?.data
    });

    // Enhanced error handling
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({ 
        success: false, 
        error: 'AI service timeout. Please try again.' 
      });
    }
    
    if (error.response) {
      // OpenRouter specific errors
      const status = error.response.status;
      if (status === 401) {
        return res.status(500).json({ 
          success: false, 
          error: 'AI service configuration error' 
        });
      }
      if (status === 429) {
        return res.status(429).json({ 
          success: false, 
          error: 'AI service rate limit exceeded. Please try again later.' 
        });
      }
    }

    next({
      status: error.response?.status || 500,
      message: 'AI service is currently unavailable. Please try again later.',
      isAxiosError: true
    });
  }
});

// Health check for AI service
router.get('/status', async (req, res) => {
  try {
    const API_KEY = process.env.OPENROUTER_API_KEY;
    res.json({ 
      status: API_KEY ? 'configured' : 'missing_api_key',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Status check failed' });
  }
});

export default router;