import jwt from "jsonwebtoken";
import { envConfig } from "../config/envValidator.js";
import { TOKEN_EXPIRY } from "../constants/auth.js";

interface GenerateTokenType {
  id: string;
  type: "accessToken" | "refreshToken";
  role: "student" | "instructor";
}

export function generateToken({ id, type, role }: GenerateTokenType) {
  return jwt.sign({ id, role }, envConfig[type], {
    expiresIn: TOKEN_EXPIRY[type],
  });
}
