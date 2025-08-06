// Health check endpoint for Vercel
module.exports = (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: 'vercel'
  });
};