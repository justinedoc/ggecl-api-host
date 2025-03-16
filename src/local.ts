import { envConfig } from "./config/envValidator.js";
import app from "./server.js";

const PORT = Number(envConfig.port) || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
