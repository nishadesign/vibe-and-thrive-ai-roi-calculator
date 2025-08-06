const { VertexAI } = require('@google-cloud/vertexai');

// Initialize Vertex AI with better error handling
let vertexAI = null;
let generativeModel = null;

function initializeVertexAI() {
  if (!process.env.GOOGLE_CLOUD_PROJECT_ID) {
    console.log('Vertex AI not configured - missing project ID');
    return false;
  }

  try {
    console.log('Initializing Vertex AI for Vercel...');
    console.log('Project ID:', process.env.GOOGLE_CLOUD_PROJECT_ID);
    console.log('Location:', process.env.GOOGLE_CLOUD_LOCATION || 'us-central1');
    console.log('Has base64 credentials:', !!process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64);
    
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64) {
      const credentials = JSON.parse(
        Buffer.from(process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64, 'base64').toString()
      );
      
      vertexAI = new VertexAI({
        project: process.env.GOOGLE_CLOUD_PROJECT_ID,
        location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
        googleAuthOptions: {
          credentials: credentials
        }
      });
    } else {
      console.log('No base64 credentials found');
      return false;
    }

    generativeModel = vertexAI.preview.getGenerativeModel({
      model: 'gemini-pro',
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.7,
        topP: 0.8,
        topK: 40
      }
    });
    
    console.log('Vertex AI initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize Vertex AI:', error);
    return false;
  }
}

module.exports = async (req, res) => {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { taskName, roiSummary } = req.body;

    if (!taskName || !roiSummary) {
      return res.status(400).json({ error: 'taskName and roiSummary are required' });
    }

    // Initialize Vertex AI if not already done
    if (!generativeModel && !initializeVertexAI()) {
      return res.status(500).json({ 
        error: 'Vertex AI not available',
        details: 'Google Cloud credentials not properly configured'
      });
    }

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

    const result = await generativeModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });

    const response = await result.response;
    const insights = response.text();

    if (!insights) {
      throw new Error('No insights generated');
    }

    res.status(200).json({ insights });
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
};