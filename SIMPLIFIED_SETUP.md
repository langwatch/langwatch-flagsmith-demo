# ✅ Simplified Setup - Using Mastra API Only

## What Changed

We've **removed the need for a separate Express server**. Now you only need to run Mastra!

## How to Use

### 1. Start Mastra

```bash
pnpx mastra dev
```

That's it! ✨

### 2. Test It

**Option A: Web Interface (Recommended)**
- Open `examples/chat.html` in your browser
- Start chatting with the banking agent!

**Option B: Command Line**
```bash
curl -X POST http://localhost:3003/api/agents/bankingAgent/generate \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "What is my account balance?"}
    ]
  }'
```

**Option C: Mastra Playground**
- Visit http://localhost:3003 (or the port Mastra tells you)
- Use the built-in playground UI

## API Endpoint

```
POST /api/agents/bankingAgent/generate
```

### Request Format

```json
{
  "messages": [
    {"role": "user", "content": "What is my account balance?"},
    {"role": "assistant", "content": "Your checking account..."},
    {"role": "user", "content": "Transfer $100 to savings"}
  ]
}
```

The `messages` array should contain the full conversation history for context.

### Response Format

```json
{
  "text": "The agent's response text",
  "usage": {
    "inputTokens": 100,
    "outputTokens": 50,
    "totalTokens": 150
  },
  "steps": [...],
  "finishReason": "stop"
}
```

## What Happened to Express?

**You don't need it!** Mastra provides:
- ✅ Built-in API endpoints for agents
- ✅ Automatic LangWatch tracing
- ✅ Playground UI for testing
- ✅ Better integration with the agent ecosystem

The Express server (`src/server.ts`) is still there if you want custom endpoints, but it's not required for basic usage.

## Conversation Threading

With Mastra's API, you handle conversation history by:

1. **Store messages in your frontend**:
```javascript
let messages = [];

// User sends message
messages.push({role: 'user', content: userInput});

// Call API with full history
const response = await fetch('/api/agents/bankingAgent/generate', {
  body: JSON.stringify({ messages })
});

// Add assistant response
messages.push({role: 'assistant', content: response.text});
```

2. **For persistence**, use your own database or Mastra's storage features.

## Benefits

| Feature | Mastra API | Express Server |
|---------|-----------|----------------|
| Setup | ⭐ One command | ⭐⭐ Two servers |
| LangWatch | ✅ Automatic | ⚠️ Manual setup |
| Playground | ✅ Included | ❌ Not included |
| Maintenance | ⭐ Less code | ⭐⭐ More code |

## Frontend Integration

The `examples/chat.html` has been updated to work with Mastra's API. It:
- Maintains conversation history client-side
- Sends full context to the agent
- Handles responses properly

## What About Express Features?

If you need Express-specific features (custom auth, rate limiting, etc.), you can:

1. **Keep Express**: Run both servers (Mastra for agents, Express for custom logic)
2. **Extend Mastra**: Add custom endpoints using Mastra's API extension features
3. **Use Middleware**: Mastra supports middleware for auth, logging, etc.

## Next Steps

1. ✅ Start Mastra: `pnpx mastra dev`
2. ✅ Open `examples/chat.html` in your browser
3. ✅ Chat with your banking agent!
4. ✅ Check LangWatch dashboard for traces

That's it! Much simpler than running two servers. 🚀
