import express from "express";
import { configDotenv } from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { AuthMiddleware } from "./middlewares/auth.middleware";
import { connectMongoDB } from "./libs/mongodb";
import { LogError } from "./helpers/LogErrors";
import { HandleGithubWebhook } from "./services/github.service";
import { ErrorMiddleware } from "./middlewares/error.middleware";
// ROUTES
import AuthRoutes from "./routes/auth.route";
import ProjectRoutes from "./routes/projects.route";
import DeploymentRoutes from "./routes/deployment.route";
import SettingsRoutes from "./routes/settings.route";
import AutomationRoutes from "./routes/automation.route";
import ServerRoutes from "./routes/server.route";
import DashboardRoutes from "./routes/dashboard.route";
import IntegrationRoutes from "./routes/integrations.route";
import WebhookRoutes from "./routes/webhook.route";
import ProcessesRoutes from "./routes/processes.route";
import AIRoutes from "./routes/ai.routes";

// SSE
import SSERoutes from "./routes/sse.route";

// Crons

import CronRoutes from "./routes/cron.route"

configDotenv();
const app = express();

app.use(
  cors({
    origin: process.env.UI_APP,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.post("/webhook/github/:tenant_id/:project_id", HandleGithubWebhook);
app.use("/api/auth", AuthRoutes);
app.use("/api/projects", ProjectRoutes);
app.use("/api/deployments", DeploymentRoutes);
app.use("/api/settings", SettingsRoutes);
app.use("/api/automations", AutomationRoutes);
app.use("/api/dashboard", DashboardRoutes);
app.use("/api/integrations", IntegrationRoutes);
app.use("/api/webhooks", WebhookRoutes);
app.use("/api/processes", ProcessesRoutes);
app.use("/api/cron",CronRoutes)
app.use("/api/servers", ServerRoutes);

app.use("/api/ai", AIRoutes);

app.use("/", AuthMiddleware, SSERoutes);

app.get("/", (req, res) => {
  res.send("Backend is runnig");
});
app.use(ErrorMiddleware);
const PORT = Number(process.env.PORT) || 3001;

process.on("uncaughtException", (error) => {
  LogError(error);
});

process.on("unhandledRejection", (reason) => {
  LogError(reason);
});

async function startServer() {
  try {
    await connectMongoDB();
  } catch (error) {
    console.error("Mongo failed, but continuing...", error);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log("Server running on Port ", PORT);
  });
}

startServer();
