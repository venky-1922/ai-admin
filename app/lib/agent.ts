import { createAgent } from "langchain";
import { ChatGroq } from "@langchain/groq";
// import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { MemorySaver } from "@langchain/langgraph";

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
// const client = new MultiServerMCPClient({
//   math: {
//     transport: "stdio",
//     command: "node",
//     args: ["./app/lib/tools/mathServerTool.js"],
//   },
//   userDb: {
//     // ← add this
//     transport: "stdio",
//     command: "node",
//     args: ["./app/lib/tools/userDbServer.js"], // ← path to new file
//     env: {
//       MONGODB_URI: process.env.MONGODB_URI!, // ← pass the env variable
//     },
//   },
// });

const llm = new ChatGroq({
  model: "llama-3.3-70b-versatile",
});
const memory = new MemorySaver()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedAgent: any = null; // ← cache here

export const agent = async () => {
  if (cachedAgent) return cachedAgent; // ← reuse on every call

  // const tools = await client.getTools();

  cachedAgent = createAgent({
    model: llm,
    tools: [],
    checkpointer:memory,
    systemPrompt:
      "You are a friendly AI assistant. For greetings and casual conversation, respond naturally. For any factual questions or tasks (math, weather, database operations, etc.), always use the available tools and mention the tool name used. If tools were called but returned no answer, say 'I don't know'. If a task required tools but none were called, say 'tools are not called'. Never answer factual questions from your own knowledge — use tools instead.",
  });

  return cachedAgent;
};
