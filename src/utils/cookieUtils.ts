import { Response } from "express";
import { envConfig } from "../config/envValidator.js";
import { COOKIE_MAX_AGE } from "../constants/auth.js";

const options = {
  httpOnly: true,
  secure: envConfig.environment === "PROD",
  sameSite: envConfig.environment === "PROD" ? "none" : "strict",
  partitioned: envConfig.environment === "PROD",
} as const;

export const setRefreshTokenCookie = (res: Response, token: string) => {
  res.cookie("session", token, {
    maxAge: COOKIE_MAX_AGE,
    ...options
  });
};

export const clearRefreshTokenCookie = (res: Response) => {
  res.clearCookie("session", options);
};
