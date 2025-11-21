import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { getCustomerById, getAccountById, mockCustomers } from '../../data/mockData';
import { isTransactionDisputeEnabled } from '../../utils/flags';

export const listAccounts = createTool({
  id: 'list-accounts',
  description: 'List all accounts for a customer.',
  inputSchema: z.object({
    customerId: z.string(),
  }),
  outputSchema: z.object({
    accounts: z.array(z.object({
        id: z.string(),
        type: z.string(),
        balance: z.number(),
        currency: z.string()
    })),
  }),
  execute: async ({ context }) => {
      const customer = getCustomerById(context.customerId);
      if (!customer) {
          throw new Error(`Customer ${context.customerId} not found`);
      }
      return {
          accounts: customer.accounts.map(a => ({
              id: a.id,
              type: a.type,
              balance: a.balance,
              currency: a.currency
          }))
      };
  },
});

export const getAccountBalance = createTool({
  id: 'get-account-balance',
  description: 'Get the balance of a specific account.',
  inputSchema: z.object({
    customerId: z.string(),
    accountId: z.string(),
  }),
  outputSchema: z.object({
    balance: z.number(),
    currency: z.string(),
  }),
  execute: async ({ context }) => {
    const account = getAccountById(context.customerId, context.accountId);
    if (!account) {
      throw new Error(`Account ${context.accountId} not found for customer ${context.customerId}`);
    }
    return {
      balance: account.balance,
      currency: account.currency,
    };
  },
});

export const listTransactions = createTool({
  id: 'list-transactions',
  description: 'List transactions for a specific account.',
  inputSchema: z.object({
    customerId: z.string(),
    accountId: z.string(),
    limit: z.number().optional().default(5),
  }),
  outputSchema: z.object({
    transactions: z.array(z.object({
        id: z.string(),
        date: z.string(),
        amount: z.number(),
        description: z.string(),
        merchant: z.string(),
    })),
  }),
  execute: async ({ context }) => {
    const account = getAccountById(context.customerId, context.accountId);
    if (!account) {
      throw new Error(`Account ${context.accountId} not found for customer ${context.customerId}`);
    }
    const txs = account.transactions.slice(0, context.limit);
    return {
      transactions: txs.map(t => ({
          id: t.id,
          date: t.date,
          amount: t.amount,
          description: t.description,
          merchant: t.merchant
      })),
    };
  },
});

export const transferFunds = createTool({
  id: 'transfer-funds',
  description: 'Transfer funds between two accounts.',
  inputSchema: z.object({
    customerId: z.string(),
    fromAccountId: z.string(),
    toAccountId: z.string(),
    amount: z.number().positive(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    transactionId: z.string(),
  }),
  execute: async ({ context }) => {
    const fromAccount = getAccountById(context.customerId, context.fromAccountId);
    const toAccount = getAccountById(context.customerId, context.toAccountId);

    if (!fromAccount || !toAccount) {
      throw new Error('One or both accounts not found.');
    }

    if (fromAccount.balance < context.amount) {
      return {
          success: false,
          message: 'Insufficient funds.',
          transactionId: ''
      };
    }

    // Simulate transfer
    fromAccount.balance -= context.amount;
    toAccount.balance += context.amount;

    return {
      success: true,
      message: `Successfully transferred ${context.amount} from ${context.fromAccountId} to ${context.toAccountId}`,
      transactionId: `tx_transfer_${Date.now()}`,
    };
  },
});

export const deepResearch = createTool({
  id: 'deep-research',
  description: 'Analyze customer history and provide insights on spending trends and financial health.',
  inputSchema: z.object({
    customerId: z.string(),
    query: z.string().describe('Specific aspect to analyze, e.g., "spending trends", "quarterly results"'),
  }),
  outputSchema: z.object({
    analysis: z.string(),
  }),
  execute: async ({ context }) => {
    const customer = getCustomerById(context.customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    // Mock analysis logic
    let analysis = `Deep research analysis for ${customer.name}:\n`;
    if (context.query.includes('spending')) {
        analysis += "Spending has increased by 15% over the last quarter. Major categories: Software, Marketing.";
    } else if (context.query.includes('quarter')) {
        analysis += "Q3 results show a net positive cash flow. Savings have grown by 5%.";
    } else {
        analysis += "Customer financial health is stable. Consistent income streams detected.";
    }

    return { analysis };
  },
});

export const transactionDispute = createTool({
  id: 'transaction-dispute',
  description: 'Initiate a dispute for a specific transaction.',
  inputSchema: z.object({
    customerId: z.string(),
    transactionId: z.string(),
    reason: z.string(),
  }),
  outputSchema: z.object({
    status: z.string(),
    ticketId: z.string().optional(),
    message: z.string().optional(),
  }),
  execute: async ({ context }) => {
     const enabled = await isTransactionDisputeEnabled();
     if (!enabled) {
         return {
             status: 'failed',
             message: 'Transaction dispute feature is currently unavailable.',
         };
     }

     return {
         status: 'Dispute initiated',
         ticketId: `ticket_${context.transactionId}_${Date.now()}`
     };
  },
});

export const commonSupport = createTool({
  id: 'common-support',
  description: 'Provide answers to common banking support questions.',
  inputSchema: z.object({
    topic: z.string().describe('The support topic, e.g., "fees", "hours", "cards"'),
  }),
  outputSchema: z.object({
    info: z.string(),
  }),
  execute: async ({ context }) => {
      const kb: Record<string, string> = {
          'fees': 'Monthly maintenance fee is $10, waived with $5000 minimum balance.',
          'hours': 'Branches are open 9am-5pm Mon-Fri.',
          'cards': 'To report a lost card, call 1-800-LOST-CARD immediately.',
      };

      // Simple keyword matching
      for (const key in kb) {
          if (context.topic.toLowerCase().includes(key)) {
              return { info: kb[key] };
          }
      }
      return { info: 'Please contact our support hotline for this specific issue.' };
  },
});
