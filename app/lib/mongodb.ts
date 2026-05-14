import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "";

let isConnected = false;

export async function connectDB() {
  if (isConnected) return;
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    return;
  }
  try {
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
    console.log("Mongodb connection successful");
  } catch (error) {
    console.log("MongoDB connection error:", error);
    throw error;
  }
}