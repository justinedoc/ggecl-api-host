import { UserRole } from "./roleMappings.js";

export interface JwtPayloadExtended {
  exp: number;
  id: string;
  role: UserRole;
}

export const parseJwt = (token: string): JwtPayloadExtended => {
  try {
    if (!token) throw new Error("No token provided");
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Failed to parse JWT:", error);
    throw new Error("Failed to parse JWT: " + error);
  }
};
