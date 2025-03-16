export const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days
export const SALT_ROUNDS = 10;
export const TOKEN_EXPIRY = {
  accessToken: "15m",
  refreshToken: "7d",
  verifyEmailToken: "10m",
} as const;
