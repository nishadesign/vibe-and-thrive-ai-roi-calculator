# AI ROI Calculator with OpenAI Chat Integration

A full-stack web application that helps businesses calculate the return on investment (ROI) for AI agent deployments, featuring an integrated AI chat assistant powered by OpenAI.

## Features

- **ROI Calculator**: Calculate time savings, cost savings, and ROI percentages for AI agent implementations
- **AI Chat Assistant**: Get expert advice and insights about your ROI calculations using OpenAI
- **Modern UI**: Beautiful, responsive design with smooth scrolling and navigation
- **Real-time Calculations**: Instant ROI calculations with detailed breakdowns
- **Context-Aware AI**: The chat assistant understands your specific ROI data and provides personalized insights

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js, Express.js
- **AI Integration**: OpenAI GPT-4 API
- **Styling**: Tailwind CSS
- **Deployment**: Vercel-ready

## Prerequisites

- Node.js (version 16 or higher)
- npm or yarn
- OpenAI API key

## Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd ai-roi-calculator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   PORT=3000
   NODE_ENV=development
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## Usage

### ROI Calculator
1. Fill in the task details (name, time, frequency)
2. Enter cost information (hourly rate, number of sellers, development costs)
3. Click "Calculate ROI" to see your results
4. View time savings, cost savings, and ROI percentages

### AI Chat Assistant
1. After calculating ROI, click "Ask AI Expert"
2. Type your questions about the ROI results or AI implementation
3. Get personalized insights and recommendations from the AI assistant

## API Endpoints

- `GET /` - Serve the main application
- `POST /chat` - AI chat endpoint
  - Body: `{ message: string, roiData?: object }`
  - Returns: `{ response: string, usage: object }`
- `GET /health` - Health check endpoint

## Deployment

### Deploy to Vercel

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Set environment variables in Vercel dashboard**
   - Go to your project settings
   - Add `OPENAI_API_KEY` with your API key

### Deploy to Other Platforms

The application is compatible with any Node.js hosting platform:

- **Heroku**: Add `engines` to package.json and deploy
- **Railway**: Connect your GitHub repo and set environment variables
- **DigitalOcean App Platform**: Deploy with Node.js runtime

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | Your OpenAI API key | Yes |
| `PORT` | Server port (default: 3000) | No |
| `NODE_ENV` | Environment (development/production) | No |

## Project Structure

```
ai-roi-calculator/
├── public/
│   ├── index.html      # Main application
│   ├── style.css       # Custom styles
│   └── script.js       # Frontend JavaScript
├── server.js           # Express server
├── package.json        # Dependencies and scripts
├── env.example         # Environment variables template
└── README.md          # This file
```

## Customization

### Adding New ROI Fields
1. Add form fields in `public/index.html`
2. Update the `formData` object in `public/script.js`
3. Modify the `calculateROI` function to include new calculations

### Customizing AI Prompts
Edit the `systemPrompt` in `server.js` to change the AI assistant's behavior and expertise.

### Styling Changes
- Modify `public/style.css` for custom styles
- Update Tailwind classes in `public/index.html`

## Troubleshooting

### Common Issues

1. **"OpenAI API Key not configured"**
   - Ensure your `.env` file exists and contains the correct API key
   - Check that the API key is valid and has sufficient credits

2. **"Failed to get AI response"**
   - Check your internet connection
   - Verify OpenAI API key is correct
   - Check OpenAI service status

3. **Port already in use**
   - Change the PORT in your `.env` file
   - Kill the process using the current port

### Debug Mode
Run with debug logging:
```bash
NODE_ENV=development DEBUG=* npm run dev
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create an issue in the GitHub repository
- Check the troubleshooting section above
- Verify your OpenAI API key and credits

## Vertex AI Gemini Integration

This application now includes AI-powered insights using Google Cloud Vertex AI Gemini. After completing ROI calculations, you'll receive 2-3 actionable recommendations to optimize your automation strategy.

### Setup Vertex AI

1. **Enable Vertex AI API** in your Google Cloud Console
2. **Create a service account** with Vertex AI permissions
3. **Download the service account JSON key**
4. **Set environment variables**:
   ```bash
   GOOGLE_CLOUD_PROJECT_ID=your-project-id
   GOOGLE_CLOUD_LOCATION=us-central1
   GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account-key.json
   ```

### Service Account Permissions

Your service account needs these IAM roles:
- `Vertex AI User` - to access Gemini models
- `ML Developer` - for model operations

### Alternative Authentication

You can also authenticate using:
- Google Cloud SDK: `gcloud auth application-default login`
- Workload Identity (for GKE deployments)
- Service account impersonation

## Roadmap

- [x] Integration with Vertex AI Gemini for intelligent insights
- [ ] Add more ROI calculation models
- [ ] Export results to PDF/CSV
- [ ] User authentication and saved calculations
- [ ] Integration with more AI models
- [ ] Mobile app version 