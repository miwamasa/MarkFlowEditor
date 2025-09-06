const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'], // React app URL
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'MarkFlow Editor API Server is running',
    timestamp: new Date().toISOString()
  });
});

// Anthropic API proxy endpoint
app.post('/api/anthropic/messages', async (req, res) => {
  try {
    console.log('📨 Received request to Anthropic API');
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    // Get API key from request headers or environment
    const apiKey = req.headers['x-api-key'] || process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      return res.status(401).json({ 
        error: 'API key not provided. Set ANTHROPIC_API_KEY environment variable or pass x-api-key header.' 
      });
    }

    // Make request to Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(req.body)
    });

    console.log('📡 Anthropic API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Anthropic API error:', errorData);
      return res.status(response.status).json({
        error: `Anthropic API Error: ${response.status}`,
        details: errorData.error?.message || response.statusText
      });
    }

    const data = await response.json();
    console.log('✅ Successfully received response from Anthropic');
    console.log('Response:', JSON.stringify(data, null, 2));

    res.json(data);
  } catch (error) {
    console.error('❌ Server error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Test endpoint for development
app.post('/api/test', (req, res) => {
  console.log('🧪 Test endpoint called');
  res.json({
    message: 'Server is working!',
    receivedData: req.body,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 MarkFlow Editor API Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 API endpoint: http://localhost:${PORT}/api/anthropic/messages`);
  
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('⚠️  ANTHROPIC_API_KEY environment variable not set');
    console.log('💡 You can set it by creating a .env file or passing it via headers');
  } else {
    console.log('✅ ANTHROPIC_API_KEY is configured');
  }
});