import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import scenario, { type AgentAdapter, AgentRole } from '@langwatch/scenario';
import { bankingAgent } from '../../src/mastra/agents/banking-agent';
import { openai } from '@ai-sdk/openai';
import * as dotenv from 'dotenv';
import { isTransactionDisputeEnabled } from '../../src/utils/flags';

dotenv.config();

// Mock the flags module
vi.mock('../../src/utils/flags', () => ({
  isTransactionDisputeEnabled: vi.fn(),
}));

const bankingAgentAdapter: AgentAdapter = {
  role: AgentRole.AGENT,
  call: async (input) => {
    const result = await bankingAgent.generate(input.messages);
    return result.response.messages ?? [];
  },
};

describe('Banking Agent Scenarios', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('Check Balance and Transfer', async () => {
        const result = await scenario.run({
            name: 'check_balance_and_transfer',
            description: `
                User is a business customer (id: cust_123).
                User wants to check the balance of their checking account.
                Then user wants to transfer $500 from checking to savings.
                User confirms the transfer.
            `,
            agents: [
                bankingAgentAdapter,
                scenario.userSimulatorAgent({ model: openai('gpt-4o') }),
                scenario.judgeAgent({
                    model: openai('gpt-4o'),
                    criteria: [
                        "Agent correctly identifies the checking account balance",
                        "Agent successfully performs the transfer when requested",
                        "Agent confirms the transfer details",
                        "Agent checks for sufficient funds (implicitly handled by tool)"
                    ]
                })
            ],
            script: [
               scenario.user('check the balance of my checking account'),
               scenario.agent(),
               (state) => expect(state.hasToolCall('getAccountBalance'), 'getAccountBalance tool should be called').toBe(true),
               scenario.user(),
               scenario.agent(),
               scenario.user(),
               scenario.agent(),
               (state) => expect(state.hasToolCall('transferFunds'), 'transferFunds tool should be called').toBe(true),
               scenario.judge()
            ]
        });

        expect(result.success).toBe(true);
    }, 60000);

    it('Dispute Transaction - Feature Enabled', async () => {
        // Mock the flag as enabled
        vi.mocked(isTransactionDisputeEnabled).mockResolvedValue(true);

        const result = await scenario.run({
            name: 'dispute_transaction_enabled',
            description: `
                User wants to dispute transaction tx_1.
                User provides reason: 'Double charge'.
                Transaction dispute feature is enabled.
            `,
            agents: [
                bankingAgentAdapter,
                scenario.userSimulatorAgent({ model: openai('gpt-4o') }),
                scenario.judgeAgent({
                    model: openai('gpt-4o'),
                    criteria: [
                        "Agent acknowledges the dispute request",
                        "Agent initiates the dispute successfully and provides a ticket ID"
                    ]
                })
            ],
            script: [
                scenario.user('I want to dispute transaction tx_1 because it was a double charge'),
                scenario.agent(),
                (state) => expect(state.hasToolCall('transactionDispute'), 'transactionDispute tool should be called').toBe(true),
                scenario.judge()
            ]
        });

        expect(result.success).toBe(true);
    }, 60000);

    it('Dispute Transaction - Feature Disabled', async () => {
        // Mock the flag as disabled
        vi.mocked(isTransactionDisputeEnabled).mockResolvedValue(false);

        const result = await scenario.run({
            name: 'dispute_transaction_disabled',
            description: `
                User wants to dispute transaction tx_1.
                User provides reason: 'Double charge'.
                Transaction dispute feature is disabled.
            `,
            agents: [
                bankingAgentAdapter,
                scenario.userSimulatorAgent({ model: openai('gpt-4o') }),
                scenario.judgeAgent({
                    model: openai('gpt-4o'),
                    criteria: [
                        "Agent acknowledges the dispute request",
                        "Agent informs the user that the transaction dispute feature is currently unavailable"
                    ]
                })
            ],
            script: [
                scenario.user('I want to dispute transaction tx_1 because it was a double charge'),
                scenario.agent(),
                (state) => expect(state.hasToolCall('transactionDispute'), 'transactionDispute tool should be called').toBe(true),
                scenario.judge()
            ]
        });

        expect(result.success).toBe(true);
    }, 60000);
});
