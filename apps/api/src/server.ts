import { Router, createApp } from "./router.js";
import {
  handleCreateSnapshot,
  handleGetSnapshot,
  handleGetContext,
  handleGetGeneratedFiles,
  handleHealthCheck,
} from "./handlers.js";

const router = new Router();

// Health
router.get("/health", handleHealthCheck);

// Snapshot endpoints (per axis_all_tools.yaml api_architecture)
router.post("/v1/snapshots", handleCreateSnapshot);
router.get("/v1/snapshots/:snapshot_id", handleGetSnapshot);

// Project context endpoints
router.get("/v1/projects/:project_id/context", handleGetContext);
router.get("/v1/projects/:project_id/generated-files", handleGetGeneratedFiles);

const port = parseInt(process.env.PORT ?? "4000", 10);
createApp(router, port);
