import { createAgent } from "langchain";
import { ChatGroq } from "@langchain/groq";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";

// const client = new MultiServerMCPClient({
//   math: {
//     transport: "stdio",
//     command: "node",
//     args: ["./app/lib/tools/mathServerTool.js"],
//   },
//   // weather: {
//   //   transport: "sse",
//   //   url: "http://localhost:8000/mcp",
//   // },
// });
const client = new MultiServerMCPClient({
  math: {
    transport: "stdio",
    command: "node",
    args: ["./app/lib/tools/mathServerTool.js"],
  },
  userDb: {                                          // ← add this
    transport: "stdio",
    command: "node",
    args: ["./app/lib/tools/userDbServer.js"],       // ← path to new file
    env: {
      MONGODB_URI: process.env.MONGODB_URI!,         // ← pass the env variable
    },
  },
});

const llm = new ChatGroq({
  model: "llama-3.3-70b-versatile",
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedAgent: any = null;  // ← cache here

export const agent = async () => {
  if (cachedAgent) return cachedAgent;  // ← reuse on every call

  const tools = await client.getTools();

  cachedAgent = createAgent({
    model: llm,
    tools: tools,
    systemPrompt:
      "You are a AI assistant and should always use the tools to give the answer and in the answer just add the tool name if the tools didn't give any answer just say 'I don't know' and if tools didn't called then say 'tools are not called' but don't give answers based on your knowledge",
  });

  return cachedAgent;
};