import { router } from "../trpc.js";
import { notificationRouter } from "./notificationRouter.js";
import { forgotPasswordRouter } from "./forgotPasswordRouter.js";

export const appRouter = router({
  notification: notificationRouter,
  forgotPassword: forgotPasswordRouter,
});

export type AppRouter = typeof appRouter;

