import { createAgent } from "langchain";
import { ChatGroq } from "@langchain/groq";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { MemorySaver } from "@langchain/langgraph";

// const client = new MultiServerMCPClient({
//   // math: {
//   //   transport: "stdio",
//   //   command: "node",
//   //   args: ["./app/lib/tools/mathServerTool.js"],
//   // },
//   // weather: {
//   //   transport: "sse",
//   //   url: "http://localhost:8000/mcp",
//   // },
// });
const client = new MultiServerMCPClient({
  // math: {
  //   transport: "stdio",
  //   command: "node",
  //   args: ["./app/lib/tools/mathServerTool.js"],
  // },
  // userDb: {
  //   // ← add this
  //   transport: "stdio",
  //   command: "node",
  //   args: ["./app/lib/tools/userDbServer.js"], // ← path to new file
  //   env: {
  //     MONGODB_URI: process.env.MONGODB_URI!, // ← pass the env variable
  //   },
  // },
  userdb: {
    transport: "sse",
    url: "https://mcp-tools-l8yj.onrender.com/mcp",
  },
});

const llm = new ChatGroq({
  model: "openai/gpt-oss-120b",
});
const memory = new MemorySaver();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedAgent: any = null; // ← cache here

export const agent = async () => {
  if (cachedAgent) return cachedAgent; // ← reuse on every call

  const tools = await client.getTools();

  cachedAgent = createAgent({
    model: llm,
    tools: tools,
    checkpointer: memory,
    systemPrompt: `You are a friendly and helpful AI assistant for managing users in the database.

CRITICAL WORKFLOW RULES:
1. Always use the available tools for database operations and mention the tool name used. Never answer factual questions from your own knowledge. If tools returned no answer, say 'I don't know'. If a task required tools but none were called, say 'tools are not called'.

2. Checking for Duplicates:
   - When the user asks to add or insert a new user: You MUST FIRST check if that username already exists using the "check_duplicate_user_name" tool (or "find_user_by_name" if "check_duplicate_user_name" is not yet available in the tools list).
   - When the user asks to rename or change a user's name to a new name: You MUST FIRST check if the new name already exists using "check_duplicate_user_name" (or "find_user_by_name").

3. When a Duplicate is Found:
   - DO NOT insert or overwrite the user.
   - Inform the user clearly that a user with this name already exists.
   - Offer the user options on how to proceed:
     "A user with the name '<name>' already exists. Would you like to:
      1. View that user's existing data
      2. Update their details
      3. Choose a different username?"

4. When No Duplicate Exists:
   - Proceed to call "insert_user" (or "update_user_by_name" when renaming).

5. Subsequent User Responses:
   - If the user chooses to view the data: Call "find_user_by_name" (or display their data).
   - If the user chooses to update the details: Call "update_user_by_name".
   - If the user provides a different username: Check for duplicates on the new name before inserting.`,
  });

  return cachedAgent;
};
