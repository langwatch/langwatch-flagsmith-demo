// Load environment variables first
import dotenv from 'dotenv';
dotenv.config();

import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { LangWatch } from 'langwatch';
import * as tools from '../tools/banking';
import * as flagUtils from '../../utils/flags';

// Initialize LangWatch
const langwatch = new LangWatch({
  apiKey: process.env.LANGWATCH_API_KEY
});

// Fetch prompt
// We use top-level await which is supported in modern Node/bundlers
// If this fails, the module won't load, which is expected per guidelines
const promptData = await langwatch.prompts.get('banking_agent');

export const bankingAgent = new Agent({
  name: 'Banking Assistant',
  instructions: promptData?.prompt || 'You are a banking assistant.',
  model: openai('gpt-5-nano'),
  tools: {
      listAccounts: tools.listAccounts, // Added this
      getAccountBalance: tools.getAccountBalance,
      listTransactions: tools.listTransactions,
      transferFunds: tools.transferFunds,
      deepResearch: tools.deepResearch,
      transactionDispute: tools.transactionDispute,
      commonSupport: tools.commonSupport,
  },
});
