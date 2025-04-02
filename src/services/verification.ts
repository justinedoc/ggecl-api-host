import { envConfig } from "../config/envValidator.js";
import crypto from "crypto";

interface VerificationTokenPayload {
  token: string;
  expires: Date;
}

const TOKEN_EXPIRATION_MINUTES = 10;
const TOKEN_BYTES = 40;

export const generateVerificationToken = (): VerificationTokenPayload => ({
  token: crypto.randomBytes(TOKEN_BYTES).toString("hex"),
  expires: new Date(Date.now() + TOKEN_EXPIRATION_MINUTES * 60 * 1000),
});

export const constructVerificationLink = (token: string): string =>
  `${envConfig.verifyEmailBaseUrl}?token=${token}`;
