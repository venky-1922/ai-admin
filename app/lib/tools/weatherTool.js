import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import express from "express";

const app = express();
app.use(express.json());

const server = new Server(
    { name: "weather-server", version: "0.1.0" },
    { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [{
            name: "get_weather",
            description: "Get weather for location",
            inputSchema: {
                type: "object",
                properties: {
                    location: { type: "string", description: "Location to get weather for" },
                },
                required: ["location"],
            },
        }],
    };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "get_weather") {
        const { location } = request.params.arguments;
        return {
            content: [{ type: "text", text: `It's always sunny in ${location}` }],
        };
    }
    throw new Error(`Unknown tool: ${request.params.name}`);
});

// ✅ new API for v1.29.0
const transports = {};

app.get("/mcp", async (req, res) => {
    console.log("New SSE connection");
    const transport = new SSEServerTransport("/mcp/messages", res);
    transports[transport.sessionId] = transport;

    res.on("close", () => {
        console.log("SSE connection closed:", transport.sessionId);
        delete transports[transport.sessionId];
    });

    await server.connect(transport);
});

app.post("/mcp/messages", async (req, res) => {
    const sessionId = req.query.sessionId;
    console.log("Message received for session:", sessionId);
    const transport = transports[sessionId];
    if (transport) {
        await transport.handlePostMessage(req, res);
    } else {
        res.status(404).json({ error: "Session not found" });
    }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Weather MCP server running on port ${PORT}`);
});