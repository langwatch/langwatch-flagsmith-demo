import { describe, it, expect } from 'vitest';
import scenario, { type AgentAdapter, AgentRole } from '@langwatch/scenario';
import { bankingAgent } from '../../src/mastra/agents/banking-agent';
import { openai } from '@ai-sdk/openai';
import * as dotenv from 'dotenv';

dotenv.config();

const bankingAgentAdapter: AgentAdapter = {
  role: AgentRole.AGENT,
  call: async (input) => {
    const messages = input.messages.map(m => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: String(m.content)
    }));

    const result = await bankingAgent.generate(messages);
    return [{ role: 'assistant', content: result.text }];
  },
};

describe('Banking Agent Scenarios', () => {
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
               scenario.user(),
               scenario.agent(),
               (state) => expect(state.hasToolCall('get-account-balance')).toBe(true),
               (state) => expect(state.hasToolCall('transfer-funds')).toBe(true),
               scenario.judge()
            ]
        });

        expect(result.success).toBe(true);
    }, 60000);

    it('Dispute Transaction - Flag Logic', async () => {
         const result = await scenario.run({
            name: 'dispute_transaction',
            description: `
                User wants to dispute transaction tx_1.
                User provides reason: 'Double charge'.
            `,
            agents: [
                bankingAgentAdapter,
                scenario.userSimulatorAgent({ model: openai('gpt-4o') }),
                scenario.judgeAgent({
                    model: openai('gpt-4o'),
                    criteria: [
                        "Agent acknowledges the dispute request",
                        "If the feature is enabled, agent initiates the dispute and provides a ticket ID",
                        "If the feature is disabled, agent politely informs the user it's unavailable"
                    ]
                })
            ]
        });

        expect(result.success).toBe(true);
    }, 60000);
});
