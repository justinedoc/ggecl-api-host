import { TRPCError } from "@trpc/server";
import { t } from "../trpc.js";

import jwt from "jsonwebtoken";
import { envConfig } from "../config/envValidator.js";

export const authenticator = t.middleware(({ ctx: { req }, next }) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    throw new TRPCError({
      message: "Invalid authorization header",
      code: "UNAUTHORIZED",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, envConfig.accessToken) as { id?: string };
    if (!decoded?.id) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid token payload",
      });
    }

    return next({
      ctx: { user: { id: decoded.id } },
    });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new TRPCError({
        message: "token has expired",
        code: "UNAUTHORIZED",
      });
    }

    if (error instanceof jwt.JsonWebTokenError) {
      throw new TRPCError({
        message: "invalid token",
        code: "BAD_REQUEST",
      });
    }

    console.error("Authentication error:", error);
    throw new TRPCError({
      message: "Authentication failed",
      code: "INTERNAL_SERVER_ERROR",
    });
  }
});
