import { router } from "../trpc.js";
import { notificationRouter } from "./notificationRouter.js";
import { forgotPasswordRouter } from "./forgotPasswordRouter.js";
import { cartRouter } from "./cartRouter.js"

export const appRouter = router({
  notification: notificationRouter,
  forgotPassword: forgotPasswordRouter,
  cart: cartRouter,
});

export type AppRouter = typeof appRouter;

