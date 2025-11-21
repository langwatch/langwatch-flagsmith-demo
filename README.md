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

### Running the Agent

To start the Mastra development server:

```bash
pnpx mastra dev
```

This will open the Mastra UI where you can interact with the agent.

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

## License

ISC

