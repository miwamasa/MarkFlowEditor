# MarkFlow Editor Backend Server

This Node.js server provides a CORS-enabled proxy to access the Anthropic Claude API from the MarkFlow Editor frontend.

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Anthropic API key:
   ```
   ANTHROPIC_API_KEY=sk-ant-api03-your-api-key-here
   PORT=3001
   ```

3. **Start the Server**
   ```bash
   # Development mode (with auto-restart)
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### Health Check
- **GET** `/health`
- Returns server status and timestamp

### Anthropic API Proxy
- **POST** `/api/anthropic/messages`
- Proxies requests to Anthropic's Claude API
- Requires `x-api-key` header with your Anthropic API key

### Test Endpoint
- **POST** `/api/test`
- Simple test endpoint for development

## Usage with MarkFlow Editor

1. Start this backend server on port 3001
2. Start the MarkFlow Editor frontend (usually port 3000)
3. Configure your Anthropic API key in the AI Settings
4. The frontend will automatically use the real Anthropic API through this server

## Troubleshooting

- **CORS Issues**: The server is configured to allow requests from `http://localhost:3000`
- **API Key Issues**: Make sure your API key is set in the `.env` file or passed via headers
- **Port Conflicts**: Change the PORT in `.env` if 3001 is already in use

## Security Notes

- This server is for development use
- For production, implement proper authentication and rate limiting
- Never expose your API key in frontend code