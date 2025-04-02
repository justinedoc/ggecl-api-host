import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import compression from "compression";

// Controllers & Routes
import refresh from "./controllers/refresh.js";
import studentRoutes from "./routes/studentRoutes.js";
import instructorRoutes from "./routes/instructorRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import verifyEmailRoutes from "./routes/emailVerifyRoutes.js";
import sessionRoute from "./routes/sessionRoute.js";

// Configs & Middlewares
import { errorHandler } from "./middlewares-old/errorHandler.js";
import { connectToCache } from "./config/redisConfig.js";
import { connectToDb } from "./config/mongodbConfig.js";
import logoutRoute from "./routes/logoutRoute.js";

import { createContext } from "./context.js";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./routers/appRouter.js";

const app = express();

// Middlewares
app.use(
  cors({
    credentials: true,
    origin: ["http://localhost:5173", "https://ggecl-preview.vercel.app"],
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
app.use(`${ROUTE_PREFIX}`, logoutRoute);

app.use(
  "/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

app.use(`${ROUTE_PREFIX}/health-check`, (req, res) => {
  res.send("Server is running!");
});

// Error handling middleware
app.use(errorHandler);

export async function init() {
  try {
    await connectToDb();
    await connectToCache();
    console.log("✅ Database and Cache connected.");
  } catch (err) {
    console.error("Initialization error:", err);
  }
}

export default app;
