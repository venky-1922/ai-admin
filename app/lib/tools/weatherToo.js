import express from "express";

import { Server } from "@modelcontextprotocol/sdk/server/index.js";

import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";

import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const app = express();

const server = new Server(
  {
    name: "weather-server",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_weather",
        description: "Get weather for a location",
        inputSchema: {
          type: "object",
          properties: {
            location: {
              type: "string",
            },
          },
          required: ["location"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "get_weather": {
      const { location } = request.params.arguments;

      return {
        content: [
          {
            type: "text",
            text: `It's always sunny in ${location}`,
          },
        ],
      };
    }

    default:
      throw new Error("Unknown tool");
  }
});

app.get("/mcp", async (req, res) => {
  const transport = new SSEServerTransport("/mcp", res);

  await server.connect(transport);
});

const PORT = 8000;

app.listen(PORT, () => {
  console.log(`✅ Weather MCP Server running on ${PORT}`);
});