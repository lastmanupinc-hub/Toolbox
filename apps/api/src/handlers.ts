import type { IncomingMessage, ServerResponse } from "node:http";
import {
  createSnapshot,
  getSnapshot,
  updateSnapshotStatus,
  getProjectSnapshots,
} from "@axis/snapshots";
import type { SnapshotInput, SnapshotManifest, FileEntry } from "@axis/snapshots";
import { buildContextMap, buildRepoProfile } from "@axis/context-engine";
import type { ContextMap, RepoProfile } from "@axis/context-engine";
import { sendJSON, readBody } from "./router.js";

// In-memory result store (production: use DB)
const contextMaps = new Map<string, ContextMap>();
const repoProfiles = new Map<string, RepoProfile>();

export async function handleCreateSnapshot(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const raw = await readBody(req);
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw);
  } catch {
    sendJSON(res, 400, { error: "Invalid JSON body" });
    return;
  }

  // Validate required fields
  const manifest = body.manifest as SnapshotManifest | undefined;
  if (!manifest?.project_name || !manifest?.project_type || !manifest?.frameworks || !manifest?.goals || !manifest?.requested_outputs) {
    sendJSON(res, 400, {
      error: "Missing required manifest fields: project_name, project_type, frameworks, goals, requested_outputs",
    });
    return;
  }

  const files = body.files as FileEntry[] | undefined;
  if (!files || !Array.isArray(files) || files.length === 0) {
    sendJSON(res, 400, { error: "files array is required and must not be empty" });
    return;
  }

  // Validate file entries
  for (const file of files) {
    if (!file.path || typeof file.content !== "string") {
      sendJSON(res, 400, { error: "Each file must have path (string) and content (string)" });
      return;
    }
    file.size = file.size ?? Buffer.byteLength(file.content, "utf-8");
  }

  const input: SnapshotInput = {
    input_method: (body.input_method as SnapshotInput["input_method"]) ?? "api_submission",
    manifest,
    files,
  };

  const snapshot = createSnapshot(input);

  // Process synchronously for v1 (production: queue to worker)
  try {
    const contextMap = buildContextMap(snapshot);
    const repoProfile = buildRepoProfile(snapshot);

    contextMaps.set(snapshot.snapshot_id, contextMap);
    repoProfiles.set(snapshot.snapshot_id, repoProfile);
    updateSnapshotStatus(snapshot.snapshot_id, "ready");

    sendJSON(res, 201, {
      snapshot_id: snapshot.snapshot_id,
      project_id: snapshot.project_id,
      status: "ready",
      context_map: contextMap,
      repo_profile: repoProfile,
    });
  } catch (err) {
    updateSnapshotStatus(snapshot.snapshot_id, "failed");
    console.error("Snapshot processing failed:", err);
    sendJSON(res, 500, {
      snapshot_id: snapshot.snapshot_id,
      status: "failed",
      error: "Processing failed",
    });
  }
}

export async function handleGetSnapshot(
  _req: IncomingMessage,
  res: ServerResponse,
  params: Record<string, string>,
): Promise<void> {
  const { snapshot_id } = params;
  const snapshot = getSnapshot(snapshot_id);
  if (!snapshot) {
    sendJSON(res, 404, { error: "Snapshot not found" });
    return;
  }

  sendJSON(res, 200, {
    snapshot_id: snapshot.snapshot_id,
    project_id: snapshot.project_id,
    created_at: snapshot.created_at,
    input_method: snapshot.input_method,
    manifest: snapshot.manifest,
    file_count: snapshot.file_count,
    total_size_bytes: snapshot.total_size_bytes,
    status: snapshot.status,
  });
}

export async function handleGetContext(
  _req: IncomingMessage,
  res: ServerResponse,
  params: Record<string, string>,
): Promise<void> {
  const { project_id } = params;
  const snapshots = getProjectSnapshots(project_id);
  if (snapshots.length === 0) {
    sendJSON(res, 404, { error: "No snapshots found for project" });
    return;
  }

  const latest = snapshots[snapshots.length - 1];
  const contextMap = contextMaps.get(latest.snapshot_id);
  const repoProfile = repoProfiles.get(latest.snapshot_id);

  if (!contextMap || !repoProfile) {
    sendJSON(res, 404, { error: "Context not yet available — snapshot may still be processing" });
    return;
  }

  sendJSON(res, 200, {
    snapshot_id: latest.snapshot_id,
    context_map: contextMap,
    repo_profile: repoProfile,
  });
}

export async function handleGetGeneratedFiles(
  _req: IncomingMessage,
  res: ServerResponse,
  params: Record<string, string>,
): Promise<void> {
  const { project_id } = params;
  const snapshots = getProjectSnapshots(project_id);
  if (snapshots.length === 0) {
    sendJSON(res, 404, { error: "No snapshots found for project" });
    return;
  }

  const latest = snapshots[snapshots.length - 1];
  const contextMap = contextMaps.get(latest.snapshot_id);
  const repoProfile = repoProfiles.get(latest.snapshot_id);

  if (!contextMap || !repoProfile) {
    sendJSON(res, 404, { error: "No generated files available yet" });
    return;
  }

  sendJSON(res, 200, {
    snapshot_id: latest.snapshot_id,
    files: [
      {
        path: ".ai/context-map.json",
        content_type: "application/json",
        content: contextMap,
      },
      {
        path: ".ai/repo-profile.yaml",
        content_type: "application/yaml",
        content: repoProfile,
      },
    ],
  });
}

export async function handleHealthCheck(
  _req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  sendJSON(res, 200, {
    status: "ok",
    service: "axis-api",
    version: "0.1.0",
    timestamp: new Date().toISOString(),
  });
}
