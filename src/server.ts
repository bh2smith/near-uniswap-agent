import express from "express";
import cors from "cors";
import { config } from "dotenv";
import swaggerUi from "swagger-ui-express";
import { healthRouter } from "./routes/health";
import { uniswapRouter } from "./routes/uniswap";
import { pluginData } from "./plugin";

config(); // Load .env file

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/health", healthRouter);
app.use("/api/tools/uniswap", uniswapRouter);

// Expose plugin manifest at /.well-known/ai-plugin.json
app.get("/.well-known/ai-plugin.json", (_, res) => {
  res.json(pluginData);
});

// Swagger documentation
app.use("/docs", swaggerUi.serve, swaggerUi.setup(pluginData));

// Add this AFTER all your defined routes
app.use((req, res, next) => {
  console.log(`⚠️  No route found for ${req.method} ${req.path}`);
  next();
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
