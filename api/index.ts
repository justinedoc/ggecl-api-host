import { VercelRequest, VercelResponse } from "@vercel/node";
import app, { init } from "../src/server.js";

// Vercel's serverless function handler
export default async (req: VercelRequest, res: VercelResponse) => {
  await init();
  return app(req, res);
};
