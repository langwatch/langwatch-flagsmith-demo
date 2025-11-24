# Banking Agent Demo

This project demonstrates a banking agent built with [Mastra](https://mastra.ai), integrated with [LangWatch](https://langwatch.ai) for monitoring and testing, and [Flagsmith](https://flagsmith.com) for feature flagging.

## Overview

The agent provides customer support for businesses, with capabilities including:
- **Deep Research**: Analyze customer history.
- **Account Management**: Manage transactions, move funds, and understand quarterly results.
- **Support**: Handle common support issues.
- **Dispute Resolution**: A feature-flagged tool for handling transaction disputes.

## Tech Stack

- **Framework**: Mastra (TypeScript)
- **Monitoring & Testing**: LangWatch
- **Feature Flags**: Flagsmith
- **Test Runner**: Vitest

## Setup

1.  **Install Dependencies**:
    ```bash
    pnpm install
    ```

2.  **Environment Variables**:
    Copy `.env.example` to `.env` and add your API keys (OpenAI, LangWatch, Flagsmith).
    *Note: The keys are already provided in the `.env` file for this demo.*

3.  **Mastra Setup**:
    The project is initialized with Mastra.

## Development

### Quick Start ✅

Start the Mastra server:

```bash
pnpx mastra dev
```

This starts:
- 🎮 **Playground UI** at http://localhost:3003 (or http://localhost:4111)
- 🚀 **Agent API** at `http://localhost:3003/api/agents/bankingAgent/generate`
- 📊 **Automatic LangWatch tracing**

### Test the API

**Via curl:**
```bash
curl -X POST http://localhost:3003/api/agents/bankingAgent/generate \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "What is my account balance?"}
    ]
  }'
```

**Via Web UI:**
Open `examples/chat.html` in your browser for a beautiful chat interface!

### API Endpoint

```
POST http://localhost:3003/api/agents/bankingAgent/generate
```

**Request:**
```json
{
  "messages": [
    {"role": "user", "content": "Your message here"}
  ]
}
```

**Response:**
```json
{
  "text": "Agent response...",
  "usage": {...},
  "steps": [...]
}
```

### Notes

- ✅ **No separate Express server needed** - Mastra handles everything
- ✅ **Automatic observability** - LangWatch traces are sent automatically
- ✅ **Conversation context** - Pass the full message history in each request
- ✅ **Built-in playground** - Test agents visually in the browser

### Testing

We use **Scenario** (by LangWatch) for end-to-end agent testing.

To run the scenarios:

```bash
npx tsx tests/scenarios/banking_agent.test.ts
```
(Adjust path as needed)

### Prompts

Prompts are managed via the LangWatch Prompt CLI.

To sync prompts:
```bash
langwatch prompt sync
```

To create a new prompt:
```bash
langwatch prompt create <prompt_name>
```

## Features & Flags

-   **Transaction Dispute**: This feature is controlled by a Flagsmith flag.
    -   Flag: `transaction_dispute`
    -   When enabled, the agent can help users dispute transactions.

## Quick Links

- 📘 [API Documentation](./API.md) - Complete API reference
- 🚀 [Quick Start Guide](./QUICKSTART.md) - Get up and running in 5 minutes
- 🧪 [Agent Guidelines](./AGENTS.md) - Development best practices

## Project Structure

```
src/
├── server.ts                    # Express API server (new!)
├── mastra/
│   ├── agents/
│   │   └── banking-agent.ts     # Banking agent implementation
│   └── tools/
│       └── banking.ts           # Banking tools (accounts, transactions, etc.)
├── data/
│   └── mockData.ts              # Mock customer data
└── utils/
    └── flags.ts                 # Flagsmith integration

examples/
├── client.ts                    # TypeScript API client example
└── chat.html                    # Web interface for testing

tests/
├── scenarios/
│   ├── banking_agent.test.ts    # Agent behavior scenarios
│   └── api.test.ts              # API integration tests
└── evaluations/
    └── example_eval.ipynb       # Evaluation notebooks

scripts/
└── test-api.sh                  # API testing script
```

## License

ISC

