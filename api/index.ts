import { VercelRequest, VercelResponse } from "@vercel/node";
import app, { init } from "../src/server.js";

// Vercel's serverless function handler
export default (req: VercelRequest, res: VercelResponse) => {
  init();
  return app(req, res);
};
