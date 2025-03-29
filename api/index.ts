import { VercelRequest, VercelResponse } from "@vercel/node";
import app, { init } from "../src/server.js";

await init();

export default (req: VercelRequest, res: VercelResponse) => {
  return app(req, res);
};
