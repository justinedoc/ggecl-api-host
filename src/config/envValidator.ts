import dotenv from "dotenv";

dotenv.config();
function validateConfig() {
  const required = [
    "ACCESS_SECRET_TOKEN",
    "ENV",
    "PORT",
    "MONGODB_URI",
    "REFRESH_TOKEN_SECRET",
    "EMAIL_ADDR",
    "EMAIL_PASS",
    "VERIFY_EMAIL_BASE_URL",
    "SMTP_USER",
    "SMTP_HOST",
    "SMTP_PASS",
    "GOOGLE_CLIENT_ID",
    "REDIS_URL",
  ] as const;

  for (const secrets of required) {
    if (!process.env[secrets]) {
      throw new Error(`Missing required environment variable: ${secrets}`);
    }
  }

  return {
    accessToken: process.env.ACCESS_SECRET_TOKEN,
    dbUrl: process.env.MONGODB_URI,
    port: process.env.PORT,
    refreshToken: process.env.REFRESH_TOKEN_SECRET,
    environment: process.env.ENV,
    emailAddr: process.env.EMAIL_ADDR,
    emailPass: process.env.EMAIL_PASS,
    verifyEmailToken: process.env.VERIFY_EMAIL_TOKEN_SECRET,
    verifyEmailBaseUrl: process.env.VERIFY_EMAIL_BASE_URL,
    smtpUser: process.env.SMTP_USER,
    smtpHost: process.env.SMTP_HOST,
    smtpPass: process.env.SMTP_PASS,
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    redisUrl: process.env.REDIS_URL,
  } as const;
}

export const envConfig = validateConfig();
