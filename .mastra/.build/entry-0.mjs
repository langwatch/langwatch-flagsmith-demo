import dotenv from 'dotenv';
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { createTool } from '@mastra/core/tools';
import { openai } from '@ai-sdk/openai';
import { LangWatch, LangWatchExporter } from 'langwatch';
import { Flagsmith } from 'flagsmith-nodejs';

const forecastSchema = z.object({
  date: z.string(),
  maxTemp: z.number(),
  minTemp: z.number(),
  precipitationChance: z.number(),
  condition: z.string(),
  location: z.string()
});
function getWeatherCondition$1(code) {
  const conditions = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    95: "Thunderstorm"
  };
  return conditions[code] || "Unknown";
}
const fetchWeather = createStep({
  id: "fetch-weather",
  description: "Fetches weather forecast for a given city",
  inputSchema: z.object({
    city: z.string().describe("The city to get the weather for")
  }),
  outputSchema: forecastSchema,
  execute: async ({ inputData }) => {
    if (!inputData) {
      throw new Error("Input data not found");
    }
    const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(inputData.city)}&count=1`;
    const geocodingResponse = await fetch(geocodingUrl);
    const geocodingData = await geocodingResponse.json();
    if (!geocodingData.results?.[0]) {
      throw new Error(`Location '${inputData.city}' not found`);
    }
    const { latitude, longitude, name } = geocodingData.results[0];
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=precipitation,weathercode&timezone=auto,&hourly=precipitation_probability,temperature_2m`;
    const response = await fetch(weatherUrl);
    const data = await response.json();
    const forecast = {
      date: (/* @__PURE__ */ new Date()).toISOString(),
      maxTemp: Math.max(...data.hourly.temperature_2m),
      minTemp: Math.min(...data.hourly.temperature_2m),
      condition: getWeatherCondition$1(data.current.weathercode),
      precipitationChance: data.hourly.precipitation_probability.reduce(
        (acc, curr) => Math.max(acc, curr),
        0
      ),
      location: name
    };
    return forecast;
  }
});
const planActivities = createStep({
  id: "plan-activities",
  description: "Suggests activities based on weather conditions",
  inputSchema: forecastSchema,
  outputSchema: z.object({
    activities: z.string()
  }),
  execute: async ({ inputData, mastra }) => {
    const forecast = inputData;
    if (!forecast) {
      throw new Error("Forecast data not found");
    }
    const agent = mastra?.getAgent("weatherAgent");
    if (!agent) {
      throw new Error("Weather agent not found");
    }
    const prompt = `Based on the following weather forecast for ${forecast.location}, suggest appropriate activities:
      ${JSON.stringify(forecast, null, 2)}
      For each day in the forecast, structure your response exactly as follows:

      \u{1F4C5} [Day, Month Date, Year]
      \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

      \u{1F321}\uFE0F WEATHER SUMMARY
      \u2022 Conditions: [brief description]
      \u2022 Temperature: [X\xB0C/Y\xB0F to A\xB0C/B\xB0F]
      \u2022 Precipitation: [X% chance]

      \u{1F305} MORNING ACTIVITIES
      Outdoor:
      \u2022 [Activity Name] - [Brief description including specific location/route]
        Best timing: [specific time range]
        Note: [relevant weather consideration]

      \u{1F31E} AFTERNOON ACTIVITIES
      Outdoor:
      \u2022 [Activity Name] - [Brief description including specific location/route]
        Best timing: [specific time range]
        Note: [relevant weather consideration]

      \u{1F3E0} INDOOR ALTERNATIVES
      \u2022 [Activity Name] - [Brief description including specific venue]
        Ideal for: [weather condition that would trigger this alternative]

      \u26A0\uFE0F SPECIAL CONSIDERATIONS
      \u2022 [Any relevant weather warnings, UV index, wind conditions, etc.]

      Guidelines:
      - Suggest 2-3 time-specific outdoor activities per day
      - Include 1-2 indoor backup options
      - For precipitation >50%, lead with indoor activities
      - All activities must be specific to the location
      - Include specific venues, trails, or locations
      - Consider activity intensity based on temperature
      - Keep descriptions concise but informative

      Maintain this exact formatting for consistency, using the emoji and section headers as shown.`;
    const response = await agent.stream([
      {
        role: "user",
        content: prompt
      }
    ]);
    let activitiesText = "";
    for await (const chunk of response.textStream) {
      process.stdout.write(chunk);
      activitiesText += chunk;
    }
    return {
      activities: activitiesText
    };
  }
});
const weatherWorkflow = createWorkflow({
  id: "weather-workflow",
  inputSchema: z.object({
    city: z.string().describe("The city to get the weather for")
  }),
  outputSchema: z.object({
    activities: z.string()
  })
}).then(fetchWeather).then(planActivities);
weatherWorkflow.commit();

const weatherTool = createTool({
  id: "get-weather",
  description: "Get current weather for a location",
  inputSchema: z.object({
    location: z.string().describe("City name")
  }),
  outputSchema: z.object({
    temperature: z.number(),
    feelsLike: z.number(),
    humidity: z.number(),
    windSpeed: z.number(),
    windGust: z.number(),
    conditions: z.string(),
    location: z.string()
  }),
  execute: async ({ context }) => {
    return await getWeather(context.location);
  }
});
const getWeather = async (location) => {
  const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`;
  const geocodingResponse = await fetch(geocodingUrl);
  const geocodingData = await geocodingResponse.json();
  if (!geocodingData.results?.[0]) {
    throw new Error(`Location '${location}' not found`);
  }
  const { latitude, longitude, name } = geocodingData.results[0];
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_gusts_10m,weather_code`;
  const response = await fetch(weatherUrl);
  const data = await response.json();
  return {
    temperature: data.current.temperature_2m,
    feelsLike: data.current.apparent_temperature,
    humidity: data.current.relative_humidity_2m,
    windSpeed: data.current.wind_speed_10m,
    windGust: data.current.wind_gusts_10m,
    conditions: getWeatherCondition(data.current.weather_code),
    location: name
  };
};
function getWeatherCondition(code) {
  const conditions = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail"
  };
  return conditions[code] || "Unknown";
}

const weatherAgent = new Agent({
  name: "Weather Agent",
  instructions: `
      You are a helpful weather assistant that provides accurate weather information and can help planning activities based on the weather.

      Your primary function is to help users get weather details for specific locations. When responding:
      - Always ask for a location if none is provided
      - If the location name isn't in English, please translate it
      - If giving a location with multiple parts (e.g. "New York, NY"), use the most relevant part (e.g. "New York")
      - Include relevant details like humidity, wind conditions, and precipitation
      - Keep responses concise but informative
      - If the user asks for activities and provides the weather forecast, suggest activities based on the weather forecast.
      - If the user asks for activities, respond in the format they request.

      Use the weatherTool to fetch current weather data.
`,
  model: "openai/gpt-4o-mini",
  tools: { weatherTool },
  memory: new Memory({
    storage: new LibSQLStore({
      url: "file:../mastra.db"
      // path is relative to the .mastra/output directory
    })
  })
});

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

dotenv.config();
const langwatch = new LangWatch({
  apiKey: process.env.LANGWATCH_API_KEY
});
const promptData = await langwatch.prompts.get("banking_agent");
const bankingAgent = new Agent({
  name: "Banking Assistant",
  instructions: promptData?.prompt || "You are a banking assistant.",
  model: openai("gpt-5-nano"),
  tools: {
    listAccounts: listAccounts,
    // Added this
    getAccountBalance: getAccountBalance,
    listTransactions: listTransactions,
    transferFunds: transferFunds,
    deepResearch: deepResearch,
    transactionDispute: transactionDispute,
    commonSupport: commonSupport
  }
});

dotenv.config();
const mastra = new Mastra({
  workflows: {
    weatherWorkflow
  },
  agents: {
    weatherAgent,
    bankingAgent
  },
  storage: new LibSQLStore({
    // stores observability, scores, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: ":memory:"
  }),
  logger: new PinoLogger({
    name: "Mastra",
    level: "info"
  }),
  telemetry: {
    serviceName: "ai",
    // this must be set to "ai" so that the LangWatchExporter thinks it's an AI SDK trace
    enabled: true,
    export: {
      type: "custom",
      exporter: new LangWatchExporter({
        apiKey: process.env.LANGWATCH_API_KEY
      })
    }
  },
  observability: {
    default: {
      enabled: true
    }
  }
});

export { mastra };
