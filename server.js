const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Chat endpoint
app.post('/chat', async (req, res) => {
  try {
    const { message, roiData } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key not configured');
      return res.status(500).json({ 
        error: 'OpenAI API key not configured. Please set OPENAI_API_KEY in your .env file.' 
      });
    }

    // Create a context-aware prompt for AI ROI assistance
    let systemPrompt = `You are an AI ROI expert specializing in helping businesses calculate and understand the return on investment for AI agent deployments. 

Your expertise includes:
- AI agent cost-benefit analysis
- Time and cost savings calculations
- Implementation strategies
- Risk assessment
- Best practices for AI adoption

Provide helpful, accurate, and actionable advice. If the user provides ROI calculation data, use it to give more specific insights.`;

    // If ROI data is provided, include it in the context
    let userMessage = message;
    if (roiData) {
      userMessage = `ROI Data: ${JSON.stringify(roiData)}\n\nUser Question: ${message}`;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const response = completion.choices[0].message.content;

    res.json({ 
      response,
      usage: completion.usage 
    });

  } catch (error) {
    console.error('OpenAI API Error:', error);
    
    let errorMessage = 'Failed to get AI response';
    
    if (error.code === 'invalid_api_key') {
      errorMessage = 'Invalid OpenAI API key. Please check your API key configuration.';
    } else if (error.code === 'insufficient_quota') {
      errorMessage = 'OpenAI API quota exceeded. Please check your billing settings.';
    } else if (error.status === 429) {
      errorMessage = 'Too many requests. Please try again in a moment.';
    }
    
    res.status(500).json({ 
      error: errorMessage,
      details: error.message 
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`OpenAI API Key configured: ${process.env.OPENAI_API_KEY ? 'Yes' : 'No'}`);
}); 