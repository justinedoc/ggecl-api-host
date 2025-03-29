import mongoose from "mongoose";
import { envConfig } from "./envValidator.js";

const MONGODB_URI: string = envConfig.dbUrl;

export async function connectToDb(): Promise<void> {
  try {
    console.log("⚡ Connecting to database...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to database!");
  } catch (err) {
    console.error("❌ Database connection error:", err);
    process.exit(1);
  }
}
