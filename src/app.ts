import express from "express";
import cors from "cors";
import { config } from "dotenv";
import { healthRouter } from "./routes/health";
import { uniswapRouter } from "./routes/uniswap";
import { balancesRouter } from "./routes/balances";
import { pluginData } from "./plugin";

config(); // Load .env file

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/health", healthRouter);
app.use("/api/tools/uniswap", uniswapRouter);
app.use("/api/tools/balances", balancesRouter);
// Expose plugin manifest at /.well-known/ai-plugin.json
app.get("/.well-known/ai-plugin.json", (_, res) => {
  res.json(pluginData);
});

app.get("/", (_, res) => {
  res.redirect("/.well-known/ai-plugin.json");
});

// Add a catch-all handler for other unhandled routes
app.use((req, res) => {
  // Only log if it's not a service worker or workbox request
  if (
    !req.path.includes("sw.js") &&
    !req.path.includes("workbox") &&
    !req.path.includes("fallback") &&
    !req.path.includes("favicon")
  ) {
    console.log(`⚠️  No route found for ${req.method} ${req.path}`);
  }
  res.status(404).json({ error: "Not Found" });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

export default app;
