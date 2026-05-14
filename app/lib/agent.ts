import { createAgent } from "langchain";
// import {tool} from "@langchain/core/tools"
import { ChatGroq } from "@langchain/groq";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
// import { math_tool } from "./mcpTools";

// const addUser = tool(
//     async ()=>{

//     },
//     {
//         name:"",
//         description:"",
//     }
// )

export const agent = async () => {
  const client = new MultiServerMCPClient({
    math: {
      transport: "stdio",
      command: "node",
      args: ["./app/lib/tools/mathServerTool.js"],
    },
    // weather :{
    //     transport :"sse",
    //     url: "http://localhost:8000/mcp"
    // }

  });
  const tools = await client.getTools();
  const llm = new ChatGroq({
    model: "llama-3.3-70b-versatile",
  });
  const agent = createAgent({
    model: llm,
    tools: tools,
    systemPrompt:
      "You are a AI assistant and should always use the tools to give the answer and in the answer just add the tool name if the tools didn't give any answer just say 'I don't know' and if tools didn't called then say 'tools are not called' but don't give answers based on your knowledge",
  });
  return agent;
};
