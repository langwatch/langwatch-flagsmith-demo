import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { Flagsmith } from 'flagsmith-nodejs';

const mockCustomers = [
  {
    id: "cust_123",
    name: "Acme Corp",
    email: "contact@acme.com",
    accounts: [
      {
        id: "acc_checking_1",
        type: "checking",
        balance: 5e4,
        currency: "USD",
        transactions: [
          {
            id: "tx_1",
            date: "2023-10-01",
            amount: -1500,
            description: "Office Supplies",
            merchant: "Staples",
            category: "expenses"
          },
          {
            id: "tx_2",
            date: "2023-10-05",
            amount: 12e3,
            description: "Client Payment - Project X",
            merchant: "Client A",
            category: "income"
          },
          {
            id: "tx_3",
            date: "2023-10-10",
            amount: -500,
            description: "Lunch Meeting",
            merchant: "Bistro 55",
            category: "meals"
          },
          {
            id: "tx_4",
            date: "2023-10-12",
            amount: -200,
            description: "Subscription",
            merchant: "SaaS Tool",
            category: "software"
          }
        ]
      },
      {
        id: "acc_savings_1",
        type: "savings",
        balance: 12e4,
        currency: "USD",
        transactions: []
      }
    ]
  }
];
const getCustomerById = (id) => mockCustomers.find((c) => c.id === id);
const getAccountById = (customerId, accountId) => {
  const customer = getCustomerById(customerId);
  if (!customer) return void 0;
  return customer.accounts.find((a) => a.id === accountId);
};

const flagsmith = new Flagsmith({
  environmentKey: process.env.FLAGSMITH_SECRET_KEY || ""
});
const getFlags = async () => {
  try {
    const flags = await flagsmith.getEnvironmentFlags();
    return flags;
  } catch (error) {
    console.error("Error fetching flags:", error);
    return {
      isFeatureEnabled: () => false,
      getFeatureValue: () => null
    };
  }
};
const isTransactionDisputeEnabled = async () => {
  const flags = await getFlags();
  console.log("Feature Flags Evaluation Result:", flags);
  return flags.isFeatureEnabled("transaction_dispute");
};

const listAccounts = createTool({
  id: "list-accounts",
  description: "List all accounts for a customer.",
  inputSchema: z.object({
    customerId: z.string()
  }),
  outputSchema: z.object({
    accounts: z.array(z.object({
      id: z.string(),
      type: z.string(),
      balance: z.number(),
      currency: z.string()
    }))
  }),
  execute: async ({ context }) => {
    const customer = getCustomerById(context.customerId);
    if (!customer) {
      throw new Error(`Customer ${context.customerId} not found`);
    }
    return {
      accounts: customer.accounts.map((a) => ({
        id: a.id,
        type: a.type,
        balance: a.balance,
        currency: a.currency
      }))
    };
  }
});
const getAccountBalance = createTool({
  id: "get-account-balance",
  description: "Get the balance of a specific account.",
  inputSchema: z.object({
    customerId: z.string(),
    accountId: z.string()
  }),
  outputSchema: z.object({
    balance: z.number(),
    currency: z.string()
  }),
  execute: async ({ context }) => {
    const account = getAccountById(context.customerId, context.accountId);
    if (!account) {
      throw new Error(`Account ${context.accountId} not found for customer ${context.customerId}`);
    }
    return {
      balance: account.balance,
      currency: account.currency
    };
  }
});
const listTransactions = createTool({
  id: "list-transactions",
  description: "List transactions for a specific account.",
  inputSchema: z.object({
    customerId: z.string(),
    accountId: z.string(),
    limit: z.number().optional().default(5)
  }),
  outputSchema: z.object({
    transactions: z.array(z.object({
      id: z.string(),
      date: z.string(),
      amount: z.number(),
      description: z.string(),
      merchant: z.string()
    }))
  }),
  execute: async ({ context }) => {
    const account = getAccountById(context.customerId, context.accountId);
    if (!account) {
      throw new Error(`Account ${context.accountId} not found for customer ${context.customerId}`);
    }
    const txs = account.transactions.slice(0, context.limit);
    return {
      transactions: txs.map((t) => ({
        id: t.id,
        date: t.date,
        amount: t.amount,
        description: t.description,
        merchant: t.merchant
      }))
    };
  }
});
const transferFunds = createTool({
  id: "transfer-funds",
  description: "Transfer funds between two accounts.",
  inputSchema: z.object({
    customerId: z.string(),
    fromAccountId: z.string(),
    toAccountId: z.string(),
    amount: z.number().positive()
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    transactionId: z.string()
  }),
  execute: async ({ context }) => {
    const fromAccount = getAccountById(context.customerId, context.fromAccountId);
    const toAccount = getAccountById(context.customerId, context.toAccountId);
    if (!fromAccount || !toAccount) {
      throw new Error("One or both accounts not found.");
    }
    if (fromAccount.balance < context.amount) {
      return {
        success: false,
        message: "Insufficient funds.",
        transactionId: ""
      };
    }
    fromAccount.balance -= context.amount;
    toAccount.balance += context.amount;
    return {
      success: true,
      message: `Successfully transferred ${context.amount} from ${context.fromAccountId} to ${context.toAccountId}`,
      transactionId: `tx_transfer_${Date.now()}`
    };
  }
});
const deepResearch = createTool({
  id: "deep-research",
  description: "Analyze customer history and provide insights on spending trends and financial health.",
  inputSchema: z.object({
    customerId: z.string(),
    query: z.string().describe('Specific aspect to analyze, e.g., "spending trends", "quarterly results"')
  }),
  outputSchema: z.object({
    analysis: z.string()
  }),
  execute: async ({ context }) => {
    const customer = getCustomerById(context.customerId);
    if (!customer) {
      throw new Error("Customer not found");
    }
    let analysis = `Deep research analysis for ${customer.name}:
`;
    if (context.query.includes("spending")) {
      analysis += "Spending has increased by 15% over the last quarter. Major categories: Software, Marketing.";
    } else if (context.query.includes("quarter")) {
      analysis += "Q3 results show a net positive cash flow. Savings have grown by 5%.";
    } else {
      analysis += "Customer financial health is stable. Consistent income streams detected.";
    }
    return { analysis };
  }
});
const transactionDispute = createTool({
  id: "transaction-dispute",
  description: "Initiate a dispute for a specific transaction.",
  inputSchema: z.object({
    customerId: z.string(),
    transactionId: z.string(),
    reason: z.string()
  }),
  outputSchema: z.object({
    status: z.string(),
    ticketId: z.string().optional(),
    message: z.string().optional()
  }),
  execute: async ({ context }) => {
    const enabled = await isTransactionDisputeEnabled();
    if (!enabled) {
      return {
        status: "failed",
        message: "Transaction dispute feature is currently unavailable."
      };
    }
    return {
      status: "Dispute initiated",
      ticketId: `ticket_${context.transactionId}_${Date.now()}`
    };
  }
});
const commonSupport = createTool({
  id: "common-support",
  description: "Provide answers to common banking support questions.",
  inputSchema: z.object({
    topic: z.string().describe('The support topic, e.g., "fees", "hours", "cards"')
  }),
  outputSchema: z.object({
    info: z.string()
  }),
  execute: async ({ context }) => {
    const kb = {
      "fees": "Monthly maintenance fee is $10, waived with $5000 minimum balance.",
      "hours": "Branches are open 9am-5pm Mon-Fri.",
      "cards": "To report a lost card, call 1-800-LOST-CARD immediately."
    };
    for (const key in kb) {
      if (context.topic.toLowerCase().includes(key)) {
        return { info: kb[key] };
      }
    }
    return { info: "Please contact our support hotline for this specific issue." };
  }
});

export { commonSupport, deepResearch, getAccountBalance, listAccounts, listTransactions, transactionDispute, transferFunds };
