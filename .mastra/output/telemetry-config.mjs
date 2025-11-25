import { LangWatchExporter } from 'langwatch';

const telemetry = {
  serviceName: "ai",
  // this must be set to "ai" so that the LangWatchExporter thinks it's an AI SDK trace
  enabled: true,
  export: {
    type: "custom",
    exporter: new LangWatchExporter({
      apiKey: process.env.LANGWATCH_API_KEY
    })
  }
};

export { telemetry };
