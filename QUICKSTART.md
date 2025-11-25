# Quick Start Guide - Banking Agent API

This guide will help you get the Banking Agent API up and running in minutes.

## Prerequisites

Make sure you have:
- Node.js 18+ installed
- pnpm package manager
- Your API keys ready (OpenAI, LangWatch)

## Step 1: Environment Setup

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` and add your API keys:
```env
OPENAI_API_KEY=your_openai_api_key_here
LANGWATCH_API_KEY=your_langwatch_api_key_here
```

The Flagsmith keys are already configured for this demo.

## Step 2: Install Dependencies

```bash
pnpm install
```

## Step 3: Start the API Server

```bash
pnpm dev
```

You should see:
```
🚀 Banking Agent API server running on http://localhost:3000
📝 Chat endpoint: POST http://localhost:3000/api/chat
📊 Health check: GET http://localhost:3000/health
```

## Step 4: Test the API

### Option A: Use the Web Interface (Easiest)

1. Open `examples/chat.html` in your browser
2. Start chatting with the banking agent!

### Option B: Use the Example Client

In a new terminal:
```bash
tsx examples/client.ts
```

### Option C: Use curl

```bash
# Send a message
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "cust_123",
    "message": "What is my account balance?"
  }'
```

## Example Conversations

Try these example messages:

1. **Check Balance**
   ```
   "What is my account balance?"
   ```

2. **View Transactions**
   ```
   "Show me my recent transactions"
   ```

3. **Transfer Funds**
   ```
   "Transfer $100 from my checking to my savings account"
   ```

4. **Dispute Transaction** (feature-flagged)
   ```
   "I want to dispute transaction tx_001"
   ```

5. **General Support**
   ```
   "What are your hours?"
   ```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | Send a message to the agent |
| GET | `/api/conversation/:threadId` | Get conversation history |
| DELETE | `/api/conversation/:threadId` | Clear conversation |
| GET | `/health` | Health check |

## Architecture Overview

```
┌─────────────┐
│  Frontend   │
│   (HTML/    │
│  React/etc) │
└─────┬───────┘
      │ HTTP
      ▼
┌─────────────┐
│   Express   │
│   Server    │
│  (server.ts)│
└─────┬───────┘
      │
      ▼
┌─────────────┐      ┌──────────┐
│   Mastra    │─────▶│  Tools   │
│   Agent     │      │ (banking)│
└─────┬───────┘      └──────────┘
      │
      ▼
┌─────────────┐
│   OpenAI    │
│   (GPT-4)   │
└─────────────┘
```

## Feature Flags

The transaction dispute feature is controlled by Flagsmith:

- **Flag name**: `transaction_dispute`
- **Default**: Disabled
- **Control**: Flagsmith dashboard

When disabled, users will see:
```
"Transaction dispute feature is currently unavailable."
```

## Monitoring

All agent interactions are automatically tracked in LangWatch:
- Visit [https://app.langwatch.ai/](https://app.langwatch.ai/)
- View traces, messages, and performance metrics
- Debug issues and improve prompts

## Troubleshooting

### Server won't start
- Check that port 3000 is not in use
- Verify your `.env` file has the correct API keys
- Run `pnpm install` again

### Agent responses are slow
- This is normal for the first request (cold start)
- Subsequent requests should be faster

### CORS errors in browser
- Make sure the API server is running
- The server already has CORS enabled

### Feature flag not working
- Check Flagsmith dashboard configuration
- Verify the flag name is `transaction_dispute`

## Next Steps

- Read the full [API Documentation](./API.md)
- Check out the [Development Guidelines](./AGENTS.md)
- Write custom scenarios in `tests/scenarios/`
- Deploy to production (see deployment guides)

## Support

For issues or questions:
1. Check the documentation
2. Review the example code
3. Contact the development team

Happy coding! 🚀
