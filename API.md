# Banking Agent API

A conversational AI backend API for banking operations, powered by Mastra AI agents.

## Features

- 💬 Conversational interface for banking operations
- 🔐 Customer account management
- 💰 Transaction handling and disputes
- 📊 Deep research on customer history
- 🏦 Common banking support questions
- 🚩 Feature flags integration with Flagsmith

## API Endpoints

### POST /api/chat

Send a message to the banking agent in a conversational manner.

**Request:**
```json
{
  "threadId": "optional-thread-id",
  "customerId": "cust_123",
  "message": "What is my account balance?"
}
```

**Response:**
```json
{
  "threadId": "thread_1234567890_abc123",
  "customerId": "cust_123",
  "message": "Your checking account (acc_001) has a balance of $5,000.00 USD.",
  "timestamp": "2024-11-21T10:30:00Z"
}
```

### GET /api/conversation/:threadId

Retrieve the full conversation history for a thread.

**Response:**
```json
{
  "threadId": "thread_1234567890_abc123",
  "customerId": "cust_123",
  "messages": [
    {
      "role": "user",
      "content": "What is my account balance?",
      "timestamp": "2024-11-21T10:30:00Z"
    },
    {
      "role": "assistant",
      "content": "Your checking account (acc_001) has a balance of $5,000.00 USD.",
      "timestamp": "2024-11-21T10:30:01Z"
    }
  ]
}
```

### DELETE /api/conversation/:threadId

Clear a conversation thread.

**Response:**
```json
{
  "message": "Conversation deleted successfully",
  "threadId": "thread_1234567890_abc123"
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-11-21T10:30:00Z",
  "activeConversations": 5
}
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- OpenAI API key
- LangWatch API key
- Flagsmith client and server keys

### Installation

1. Install dependencies:
```bash
pnpm install
```

2. Set up environment variables in `.env`:
```env
OPENAI_API_KEY=your_openai_api_key
LANGWATCH_API_KEY=your_langwatch_api_key
FLAGSMITH_CLIENT_KEY=UbqGod5LyVV57g8PEMirqU
FLAGSMITH_SERVER_KEY=ser.LqyzrPcXqZb9HLcHy92Zwb
PORT=3000
```

### Running the Server

Development mode (with hot reload):
```bash
pnpm dev
```

Production mode:
```bash
pnpm start
```

The server will start on `http://localhost:3000`.

## Usage Examples

### Using curl

```bash
# Start a new conversation
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "cust_123",
    "message": "What is my account balance?"
  }'

# Continue the conversation
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "threadId": "thread_1234567890_abc123",
    "customerId": "cust_123",
    "message": "Can you show me recent transactions?"
  }'

# Get conversation history
curl http://localhost:3000/api/conversation/thread_1234567890_abc123
```

### Using the Example Client

See `examples/client.ts` for a TypeScript example client.

```bash
tsx examples/client.ts
```

## Agent Capabilities

The banking agent can help with:

1. **Account Management**
   - List all accounts
   - Check account balances
   - View transaction history

2. **Transactions**
   - Transfer funds between accounts
   - Dispute transactions (feature-flagged)

3. **Research & Analysis**
   - Deep dive into spending patterns
   - Quarterly results analysis
   - Financial health insights

4. **Support**
   - Common banking questions
   - Account information
   - General assistance

## Feature Flags

The transaction dispute feature is controlled by Flagsmith. To enable/disable:

1. Go to your Flagsmith dashboard
2. Toggle the `transaction_dispute` feature flag
3. The agent will automatically respect the flag state

## Testing

Run scenario tests:
```bash
pnpm test
```

See `tests/scenarios/` for scenario-based agent testing.

## Architecture

```
src/
├── server.ts              # Express API server
├── mastra/
│   ├── agents/
│   │   └── banking-agent.ts  # Main banking agent
│   └── tools/
│       └── banking.ts        # Banking tools (accounts, transactions, etc.)
├── data/
│   └── mockData.ts           # Mock customer data
└── utils/
    └── flags.ts              # Flagsmith integration
```

## Development Guidelines

This project follows LangWatch best practices:

- ✅ Prompts are managed via LangWatch Prompt CLI
- ✅ Agent testing with Scenario tests
- ✅ Feature flags for safe rollouts
- ✅ Comprehensive monitoring with LangWatch

See `AGENTS.md` for detailed development guidelines.

## License

ISC
