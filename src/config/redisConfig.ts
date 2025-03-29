import { createClient } from "redis";

export const redis = createClient({
  username: "default",
  password: "gKPdxuIOJuv9laBQt8YOmKYRWWFS0t2t",
  socket: {
    host: "redis-18432.c98.us-east-1-4.ec2.redns.redis-cloud.com",
    port: 18432,
  },
});

redis.on("error", (err) => {
  console.error("Redis Client Error:", err);
});

export async function connectToCache() {
  if (redis.isOpen) {
    console.log("Redis is already connected.");
    return;
  }
  console.log("⚡ Connecting to cache...");
  try {
    await redis.connect();
    console.log("✅ Connected to cache!");
  } catch (err) {
    console.error("❌ Redis connection error:", err);
    process.exit(1);
  }
}
