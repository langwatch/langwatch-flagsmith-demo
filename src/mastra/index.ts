// Load environment variables first
import dotenv from 'dotenv';
dotenv.config();

import { Mastra } from '@mastra/core/mastra';
import { OtelExporter } from "@mastra/otel-exporter";
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { bankingAgent } from './agents/banking-agent';
import { LangWatchExporter } from "langwatch";

export const mastra = new Mastra({
  agents: { bankingAgent },
  storage: new LibSQLStore({
    // stores observability, scores, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: ":memory:",
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
  // telemetry: {
  //   serviceName: "ai", // this must be set to "ai" so that the LangWatchExporter thinks it's an AI SDK trace
  //   enabled: true,
  //   export: {
  //     type: "custom",
  //     exporter: new LangWatchExporter({
  //       apiKey: process.env.LANGWATCH_API_KEY,
  //     }),
  //   },
  // },
  observability: {
    configs: {
      otel: {
        serviceName: "flagsmith-5DebaO",
        exporters: [
          new OtelExporter({
            provider: {
              custom: {
                endpoint: "https://app.langwatch.ai/api/otel/v1/traces",
                headers: { "Authorization": `Bearer ${process.env.LANGWATCH_API_KEY}` },
              },
            },
          }),
        ],
      },
    },
  },
});
