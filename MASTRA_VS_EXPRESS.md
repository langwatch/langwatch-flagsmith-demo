# Using Mastra API vs Express Server

## TL;DR - Best Practice ✅

**Use Mastra's built-in API server** with `pnpx mastra dev` - it's simpler, has better integration, and automatic LangWatch tracing.

## Option 1: Mastra Built-in API (Recommended) ✅

### How it works:

When you run `pnpx mastra dev`, Mastra automatically creates API endpoints:

```bash
pnpx mastra dev
# Server starts on http://localhost:4111 (or configured port)
```

### Built-in Endpoints:

Mastra automatically provides:
- `/api/agents/:agentId` - Direct agent interaction
- `/api/workflows/:workflowId` - Workflow execution
- Playground UI for testing

### Calling the Banking Agent:

**Method 1: Use Mastra's Agent Endpoint**

```bash
curl -X POST http://localhost:4111/api/agents/bankingAgent \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "What is my account balance?"}
    ]
  }'
```

**Method 2: Custom Chat Endpoint (if needed)**

For conversation threading and custom logic, you can extend Mastra's API. See `src/mastra/api.ts` for the custom chat handler.

### Pros:
- ✅ Single server to run
- ✅ Automatic LangWatch tracing
- ✅ Built-in playground UI
- ✅ Better integrated with Mastra ecosystem
- ✅ Less code to maintain

### Cons:
- ⚠️ Less flexibility than Express (but usually enough)
- ⚠️ Mastra-specific patterns

## Option 2: Express Server (Current Setup)

### How it works:

Run the Express server:
```bash
npm start  # or pnpm dev
# Server starts on http://localhost:3003
```

### Custom Endpoints:

```bash
curl -X POST http://localhost:3003/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "cust_123",
    "message": "What is my account balance?"
  }'
```

### Pros:
- ✅ Full Express flexibility
- ✅ Custom middleware (auth, rate limiting, etc.)
- ✅ Familiar if you know Express

### Cons:
- ❌ Need to run separate server
- ❌ Manual LangWatch integration
- ❌ More code to maintain
- ❌ Not using Mastra's built-in features

## Recommendation

### For This Demo Project: Use Mastra API ✅

Since you're already using Mastra, leverage its built-in server:

```bash
# Just run this:
pnpx mastra dev
```

Then access:
- **Playground**: http://localhost:4111
- **Agent API**: http://localhost:4111/api/agents/bankingAgent

### For Production: Hybrid Approach

If you need advanced features (auth, rate limiting, complex routing):

1. **Start with Mastra API** for agent/workflow endpoints
2. **Add Express** only if you need:
   - Complex authentication
   - Advanced middleware
   - Non-AI endpoints
   - Custom business logic

You can even run both:
- Mastra on port 4111 (internal/admin)
- Express on port 3000 (public API) that proxies to Mastra

## Migration Path

### If you want to move from Express to Mastra API:

1. **Keep using Mastra's built-in endpoints** for basic agent calls
2. **For custom logic** (like conversation threading), you have options:

   **Option A:** Handle threading in your frontend
   ```typescript
   // Frontend keeps conversation history
   const messages = [...conversationHistory, newMessage];
   await fetch('/api/agents/bankingAgent', {
     method: 'POST',
     body: JSON.stringify({ messages })
   });
   ```

   **Option B:** Create custom Mastra API endpoints
   - Extend Mastra's API with custom routes
   - See `src/mastra/api.ts` for example

   **Option C:** Use Mastra's memory/storage
   - Mastra has built-in conversation memory
   - Configure in agent setup

## Frontend Integration Examples

### With Mastra API:

```typescript
// Using Mastra's agent endpoint
async function chat(message: string, history: Message[]) {
  const response = await fetch('http://localhost:4111/api/agents/bankingAgent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [
        ...history,
        { role: 'user', content: message }
      ]
    })
  });
  return response.json();
}
```

### With Express API:

```typescript
// Using custom Express endpoint
async function chat(message: string, threadId?: string) {
  const response = await fetch('http://localhost:3003/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      threadId,
      customerId: 'cust_123',
      message
    })
  });
  return response.json();
}
```

## Current Project Files

- ✅ `src/server.ts` - Express server (can be removed if using Mastra only)
- ✅ `src/mastra/index.ts` - Mastra configuration
- ✅ `src/mastra/api.ts` - Custom API handlers (optional)
- ✅ `examples/chat.html` - Web UI (works with either approach, just change URL)

## Next Steps

### To use Mastra API only:

1. **Start Mastra:**
   ```bash
   pnpx mastra dev
   ```

2. **Update frontend examples:**
   - Change API URL to `http://localhost:4111/api/agents/bankingAgent`
   - Or keep using custom endpoints if needed

3. **Remove Express server** (optional):
   - Keep `src/server.ts` if you might need it later
   - Or remove it to simplify the project

### To keep Express:

Just remember to run both:
```bash
# Terminal 1: Mastra (for playground/observability)
pnpx mastra dev

# Terminal 2: Express (for custom API)
npm start
```

## Summary

| Feature | Mastra API | Express |
|---------|-----------|---------|
| Setup complexity | ⭐ Simple | ⭐⭐ More complex |
| LangWatch tracing | ✅ Automatic | ⚠️ Manual |
| Playground UI | ✅ Included | ❌ Not included |
| Custom endpoints | ⚠️ Limited | ✅ Full control |
| Conversation threading | ⚠️ Need to implement | ✅ Implemented |
| Best for | Demos, AI-first apps | Production APIs |

**For this banking demo: Use Mastra API.** It's simpler and has everything you need! 🚀
