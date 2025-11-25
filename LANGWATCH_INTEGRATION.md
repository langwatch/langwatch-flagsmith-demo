# LangWatch Integration Guide

## Current Setup

The banking agent API is configured to work with LangWatch for observability and tracing.

## Configuration

### 1. Environment Variables

Make sure your `.env` file has the LangWatch API key:

```env
LANGWATCH_API_KEY=your_langwatch_api_key_here
```

Get your API key from: https://app.langwatch.ai/

### 2. Mastra Observability

Mastra has built-in observability enabled in `src/mastra/index.ts`:

```typescript
observability: {
  default: { enabled: true },
}
```

This should automatically capture AI traces when `LANGWATCH_API_KEY` is set.

## Verifying Traces

### Check if traces are being sent:

1. **Start the server:**
   ```bash
   pnpm dev
   ```

2. **Send a test message:**
   ```bash
   curl -X POST http://localhost:3003/api/chat \
     -H "Content-Type: application/json" \
     -d '{
       "customerId": "cust_123",
       "message": "What is my account balance?"
     }'
   ```

3. **Check LangWatch Dashboard:**
   - Go to https://app.langwatch.ai/
   - Navigate to your project
   - Look for traces in the Messages or Traces view

### Troubleshooting

If traces aren't appearing:

1. **Verify API Key:**
   ```bash
   # Check if LANGWATCH_API_KEY is set
   echo $LANGWATCH_API_KEY
   ```

2. **Check Server Logs:**
   - Look for any errors related to LangWatch
   - Mastra should log telemetry information

3. **Verify Environment Loading:**
   - Make sure `dotenv.config()` is called at the top of files
   - Currently configured in:
     - `src/server.ts`
     - `src/mastra/index.ts`
     - `src/mastra/agents/banking-agent.ts`

4. **Test with Scenario Tests:**
   ```bash
   npx tsx tests/scenarios/banking_agent.test.ts
   ```
   
   Scenario tests should automatically send traces to LangWatch.

## Alternative: Manual Tracing

If automatic tracing doesn't work, you can manually send traces using the LangWatch SDK:

```typescript
import { LangWatch } from 'langwatch';

const langwatch = new LangWatch({
  apiKey: process.env.LANGWATCH_API_KEY
});

// After agent response
await langwatch.spans.create({
  type: 'agent',
  name: 'Banking Agent',
  input: { value: message },
  output: { value: response },
  // ... other fields
});
```

However, Mastra's built-in observability should handle this automatically.

## Expected Behavior

When properly configured:

- ✅ Every agent call should create a trace in LangWatch
- ✅ Tool calls should be captured as spans
- ✅ Token usage should be tracked
- ✅ Errors should be logged

## Support

If traces still don't appear:

1. Check Mastra documentation for observability setup
2. Verify LangWatch API key is valid
3. Check if there are any network/firewall issues
4. Review LangWatch SDK version compatibility

## Next Steps

Consider adding:
- Custom metadata to traces
- User feedback collection
- Performance monitoring
- Cost tracking
