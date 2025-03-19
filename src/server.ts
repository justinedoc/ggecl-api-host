import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import compression from "compression";
// import mongoose from "mongoose";

// Controllers & Routes
import refresh from "./controllers/refresh.js";
import studentRoutes from "./routes/studentRoutes.js";
import instructorRoutes from "./routes/instructorRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import verifyEmailRoutes from "./routes/emailVerifyRoutes.js";
import sessionRoute from "./routes/sessionRoute.js";

// Configs & Middlewares
// import { envConfig } from "./config/envValidator.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { connectToCache } from "./config/redisConfig.js";
import { connectToDb } from "./config/mongodbConfig.js";

const app = express();

// Middlewares
app.use(
  cors({
    credentials: true,
    origin: ["http://localhost:5173"],
  })
);
app.use(compression());
app.use(express.json());
app.use(cookieParser());

// Routes setup
const ROUTE_PREFIX = "/api/v1";
app.use(`${ROUTE_PREFIX}/student`, studentRoutes);
app.use(`${ROUTE_PREFIX}/instructor`, instructorRoutes);
app.use(`${ROUTE_PREFIX}/course`, courseRoutes);
app.use(`${ROUTE_PREFIX}`, verifyEmailRoutes);
app.use(`${ROUTE_PREFIX}/refresh`, refresh);
app.use(ROUTE_PREFIX, sessionRoute);
app.use(`${ROUTE_PREFIX}/health-check`, (req, res) => {
  res.send("Server is running!");
});

// Error handling middleware
app.use(errorHandler);

async function init() {
  try {
    await connectToDb();
    await connectToCache();
    console.log("Database and Redis cache connected.");
  } catch (err) {
    console.error("Initialization error:", err);
  }
}

init();

export default app;
