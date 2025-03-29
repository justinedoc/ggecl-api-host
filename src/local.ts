import mongoose from "mongoose";
import { envConfig } from "./config/envValidator.js";
import app, { init } from "./server.js";
import { redis } from "./config/redisConfig.js";

const PORT = Number(envConfig.port) || 3000;

async function startServer(): Promise<void> {
  await init();
  const server = app.listen(PORT, () => {
    console.log(`🚀 Server started on http://localhost:${PORT}`);
  });

  // Graceful shutdown
  process.on("SIGINT", async () => {
    console.log("\nShutting down server...");
    await mongoose.disconnect();
    await redis.disconnect();
    server.close(() => {
      console.log("Server and database connections closed.");
      process.exit(0);
    });
  });
}

startServer();
