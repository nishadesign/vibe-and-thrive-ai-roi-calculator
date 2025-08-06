// Minimal test endpoint
module.exports = (req, res) => {
  res.json({ message: 'Test endpoint working!', method: req.method });
};