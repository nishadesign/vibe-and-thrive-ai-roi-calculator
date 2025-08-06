const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const { VertexAI } = require('@google-cloud/vertexai');
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

// Initialize Vertex AI (only if configured)
let vertexAI = null;
let generativeModel = null;

if (process.env.GOOGLE_CLOUD_PROJECT_ID) {
  try {
    vertexAI = new VertexAI({
      project: process.env.GOOGLE_CLOUD_PROJECT_ID,
      location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
    });

    // Initialize the Gemini model
    const model = 'gemini-pro';
    generativeModel = vertexAI.preview.getGenerativeModel({
      model: model,
    });
    console.log('Vertex AI Gemini initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Vertex AI:', error.message);
    console.log('AI insights will not be available. Please check your Vertex AI configuration.');
  }
} else {
  console.log('Vertex AI not configured - AI insights will not be available');
}

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

// AI Insights endpoint - Generate actionable insights using Vertex AI Gemini
app.post('/ai-insights', async (req, res) => {
  try {
    const { taskName, roiSummary } = req.body;

    // Validate required fields
    if (!taskName || !roiSummary) {
      return res.status(400).json({ 
        error: 'taskName and roiSummary are required' 
      });
    }

    // Check if Vertex AI is configured and initialized
    if (!generativeModel) {
      console.error('Vertex AI Gemini not initialized');
      return res.status(500).json({ 
        error: 'Vertex AI not configured. Please check your Google Cloud configuration and ensure GOOGLE_CLOUD_PROJECT_ID and service account credentials are properly set.' 
      });
    }

    // Create a comprehensive prompt for Gemini to generate structured insights
    const prompt = `As an AI automation expert, analyze this ROI calculation and provide exactly 3 highly actionable insights to improve automation ROI:

Task: ${taskName}

ROI Summary:
${JSON.stringify(roiSummary, null, 2)}

Please provide specific, actionable recommendations that focus on:
1. Optimization opportunities to increase ROI
2. Implementation strategies to maximize efficiency gains
3. Risk mitigation and best practices

Format your response as exactly 3 numbered insights. Each insight MUST contain exactly these 3 components in this order:

**Actionable Recommendation:** [A specific, actionable recommendation starting with a strong action verb]
**Best Practice:** [A short tip for implementing the recommendation effectively]
**Key Success Driver:** [A critical factor that ensures the recommendation achieves maximum ROI]

Example format:
1. **Actionable Recommendation:** Implement batch processing to group similar tasks and reduce overhead.
**Best Practice:** Schedule batch processing during off-peak hours for minimal system load.
**Key Success Driver:** Ensure all data sources are properly synchronized to avoid processing delays.

2. [Second insight with same structure]
3. [Third insight with same structure]

Requirements:
- Each component should be 1-2 sentences maximum
- Focus on practical, measurable improvements
- Directly relate to the task and ROI data provided
- Use clear, professional language`;

    // Generate content using Gemini
    const result = await generativeModel.generateContent(prompt);
    const response = await result.response;
    const insights = response.text();

    // Return the insights
    res.json({ 
      insights,
      taskName,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Vertex AI Gemini Error:', error);
    
    let errorMessage = 'Failed to generate AI insights';
    
    if (error.code === 'PERMISSION_DENIED') {
      errorMessage = 'Permission denied. Please check your Google Cloud credentials and project configuration.';
    } else if (error.code === 'QUOTA_EXCEEDED') {
      errorMessage = 'Vertex AI quota exceeded. Please check your billing settings.';
    } else if (error.code === 'UNAVAILABLE') {
      errorMessage = 'Vertex AI service is temporarily unavailable. Please try again in a moment.';
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
  console.log(`Vertex AI Project configured: ${process.env.GOOGLE_CLOUD_PROJECT_ID ? 'Yes' : 'No'}`);
  console.log(`Vertex AI Gemini available: ${generativeModel ? 'Yes' : 'No'}`);
}); 