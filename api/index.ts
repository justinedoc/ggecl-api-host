import { VercelRequest, VercelResponse } from "@vercel/node";
import app from "../src/server.js";

// Vercel's serverless function handler
export default (req: VercelRequest, res: VercelResponse) => {
  return app(req, res);
};
