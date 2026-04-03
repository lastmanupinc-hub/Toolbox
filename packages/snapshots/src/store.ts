import { randomUUID } from "node:crypto";
import type {
  SnapshotInput,
  SnapshotRecord,
  SnapshotStatus,
} from "./types.js";

const store = new Map<string, SnapshotRecord>();
const projectIndex = new Map<string, string[]>(); // project_id -> snapshot_ids

export function createSnapshot(input: SnapshotInput): SnapshotRecord {
  const snapshot_id = randomUUID();
  const project_id =
    projectIndex.has(input.manifest.project_name)
      ? findProjectId(input.manifest.project_name)
      : randomUUID();

  const record: SnapshotRecord = {
    snapshot_id,
    project_id,
    created_at: new Date().toISOString(),
    input_method: input.input_method,
    manifest: input.manifest,
    file_count: input.files.length,
    total_size_bytes: input.files.reduce((sum, f) => sum + f.size, 0),
    files: input.files,
    status: "processing",
  };

  store.set(snapshot_id, record);

  const existing = projectIndex.get(project_id) ?? [];
  existing.push(snapshot_id);
  projectIndex.set(project_id, existing);

  return record;
}

export function getSnapshot(snapshot_id: string): SnapshotRecord | undefined {
  return store.get(snapshot_id);
}

export function updateSnapshotStatus(
  snapshot_id: string,
  status: SnapshotStatus,
): boolean {
  const record = store.get(snapshot_id);
  if (!record) return false;
  record.status = status;
  return true;
}

export function getProjectSnapshots(project_id: string): SnapshotRecord[] {
  const ids = projectIndex.get(project_id) ?? [];
  return ids
    .map((id) => store.get(id))
    .filter((r): r is SnapshotRecord => r !== undefined);
}

function findProjectId(project_name: string): string {
  for (const [pid, sids] of projectIndex) {
    for (const sid of sids) {
      const snap = store.get(sid);
      if (snap?.manifest.project_name === project_name) return pid;
    }
  }
  return randomUUID();
}
