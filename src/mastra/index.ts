// Load environment variables first
import dotenv from "dotenv";
dotenv.config();

import { Mastra } from "@mastra/core/mastra";
import { OtelExporter } from "@mastra/otel-exporter";
import { PinoLogger } from "@mastra/loggers";
import { LibSQLStore } from "@mastra/libsql";
import { bankingAgent } from "./agents/banking-agent";
import * as flagUtils from "../utils/flags";

export const mastra = new Mastra({
  agents: { bankingAgent },
  storage: new LibSQLStore({
    // stores observability, scores, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: ":memory:",
  }),
  logger: new PinoLogger({
    name: "Mastra",
    level: "info",
  }),
  server: {
    middleware: [
      async (context, next) => {
        const runtimeContext = context.get("runtimeContext");
        runtimeContext.set("flags", {
          transaction_dispute: await flagUtils.isTransactionDisputeEnabled(),
        });

        await next();
      },
    ],
  },
  observability: {
    configs: {
      default: {
        serviceName: "banking-agent",
        runtimeContextKeys: ["flags"],
      },
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
