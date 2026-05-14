import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  height: { type: Number, required: true },
});

export const User = mongoose.models.user || mongoose.model("user", userSchema);
