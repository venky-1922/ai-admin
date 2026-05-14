import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import mongoose from "mongoose";

await mongoose.connect(process.env.MONGODB_URI);

const User =
  mongoose.models.user ||
  mongoose.model(
    "user",
    new mongoose.Schema({
      name: { type: String, required: true },
      age: { type: Number, required: true },
      height: { type: Number, required: true },
    })
  );

const server = new Server(
  { name: "user-db-server", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_all_users",
        description: "Fetch all users from the database",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "find_user_by_name",
        description: "Find a user by their name",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Name of the user to find" },
          },
          required: ["name"],
        },
      },
      {
        name: "insert_user",
        description: "Insert a new user into the database",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", description: "User's full name" },
            age: { type: "number", description: "User's age" },
            height: { type: "number", description: "User's height in cm" },
          },
          required: ["name", "age", "height"],
        },
      },
      {
        name: "update_user_by_name",
        description: "Update a user's details by their name instead of ID",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Current name of the user to find",
            },
            new_name: {
              type: "string",
              description: "New name to set (optional)",
            },
            new_age: {
              type: "number",
              description: "New age to set (optional)",
            },
            new_height: {
              type: "number",
              description: "New height to set (optional)",
            },
          },
          required: ["name"],
        },
      },
      {
        name: "delete_user_by_name",
        description: "Delete a user by their name instead of ID",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Name of the user to delete" },
          },
          required: ["name"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "get_all_users": {
      const users = await User.find();
      if (users.length === 0) {
        return {
          content: [{ type: "text", text: "No users found in the database" }],
        };
      }
      // return clean readable format for the AI
      const formatted = users
        .map(
          (u) =>
            `- ${u.name} | age: ${u.age} | height: ${u.height}cm | id: ${u._id}`
        )
        .join("\n");
      return {
        content: [
          { type: "text", text: `Found ${users.length} users:\n${formatted}` },
        ],
      };
    }

    case "find_user_by_name": {
      // case-insensitive search so "venkatesh" finds "Venkatesh"
      const user = await User.findOne({
        name: { $regex: new RegExp(`^${args.name}$`, "i") },
      });
      if (!user) {
        return {
          content: [
            { type: "text", text: `No user found with name "${args.name}"` },
          ],
        };
      }
      return {
        content: [
          {
            type: "text",
            text: `Found user: name: ${user.name} | age: ${user.age} | height: ${user.height}cm | id: ${user._id}`,
          },
        ],
      };
    }

    case "insert_user": {
      // check if user with same name already exists
      const existing = await User.findOne({
        name: { $regex: new RegExp(`^${args.name}$`, "i") },
      });
      if (existing) {
        return {
          content: [
            { type: "text", text: `User "${args.name}" already exists` },
          ],
        };
      }
      const newUser = await User.create({
        name: args.name,
        age: Number(args.age),
        height: Number(args.height),
      });
      return {
        content: [
          {
            type: "text",
            text: `User "${newUser.name}" inserted successfully with age ${newUser.age} and height ${newUser.height}cm`,
          },
        ],
      };
    }

    case "update_user_by_name": {
      // find user by name first
      const user = await User.findOne({
        name: { $regex: new RegExp(`^${args.name}$`, "i") },
      });
      if (!user) {
        return {
          content: [
            { type: "text", text: `No user found with name "${args.name}"` },
          ],
        };
      }

      // build update object only with fields that were provided
      const updateFields = {};
      if (args.new_name) updateFields.name = args.new_name;
      if (args.new_age) updateFields.age = Number(args.new_age);
      if (args.new_height) updateFields.height = Number(args.new_height);

      if (Object.keys(updateFields).length === 0) {
        return {
          content: [{ type: "text", text: "No fields provided to update" }],
        };
      }

      const updated = await User.findByIdAndUpdate(
        user._id,
        { $set: updateFields },
        { returnDocument: "after" }
      );
      if (!updated) {
        return {
          content: "User not found",
        };
      } else
        return {
          content: [
            {
              type: "text",
              text: `User "${args.name}" updated successfully: ${JSON.stringify(
                updateFields
              )}`,
            },
          ],
        };
    }

    case "delete_user_by_name": {
      // find user by name first
      const user = await User.findOne({
        name: { $regex: new RegExp(`^${args.name}$`, "i") },
      });
      if (!user) {
        return {
          content: [
            { type: "text", text: `No user found with name "${args.name}"` },
          ],
        };
      }

      await User.findByIdAndDelete(user._id);
      return {
        content: [
          { type: "text", text: `User "${args.name}" deleted successfully` },
        ],
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("User DB MCP server running");
