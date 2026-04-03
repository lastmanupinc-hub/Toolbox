import { describe, it, expect } from "vitest";
import { createSnapshot, getSnapshot, getProjectSnapshots, updateSnapshotStatus } from "./store.js";
import type { SnapshotInput } from "./types.js";

function makeInput(overrides?: Partial<SnapshotInput>): SnapshotInput {
  return {
    input_method: "api_submission",
    manifest: {
      project_name: "test-project",
      project_type: "saas_web_app",
      frameworks: ["react"],
      goals: ["test"],
      requested_outputs: ["AGENTS.md"],
    },
    files: [
      { path: "index.ts", content: "console.log('hello')", size: 20 },
    ],
    ...overrides,
  };
}

describe("SnapshotStore", () => {
  it("creates a snapshot with correct fields", () => {
    const snap = createSnapshot(makeInput());
    expect(snap.snapshot_id).toBeTruthy();
    expect(snap.project_id).toBeTruthy();
    expect(snap.status).toBe("processing");
    expect(snap.file_count).toBe(1);
    expect(snap.manifest.project_name).toBe("test-project");
  });

  it("retrieves a snapshot by ID", () => {
    const snap = createSnapshot(makeInput());
    const found = getSnapshot(snap.snapshot_id);
    expect(found).toBeTruthy();
    expect(found!.snapshot_id).toBe(snap.snapshot_id);
  });

  it("returns undefined for unknown snapshot ID", () => {
    expect(getSnapshot("nonexistent")).toBeUndefined();
  });

  it("updates snapshot status", () => {
    const snap = createSnapshot(makeInput());
    updateSnapshotStatus(snap.snapshot_id, "ready");
    const found = getSnapshot(snap.snapshot_id);
    expect(found!.status).toBe("ready");
  });

  it("indexes snapshots by project", () => {
    const snap1 = createSnapshot(makeInput());
    const snap2 = createSnapshot(makeInput());
    const all = getProjectSnapshots(snap1.project_id);
    expect(all.length).toBeGreaterThanOrEqual(2);
    expect(all.some(s => s.snapshot_id === snap1.snapshot_id)).toBe(true);
    expect(all.some(s => s.snapshot_id === snap2.snapshot_id)).toBe(true);
  });

  it("computes total_size_bytes from files", () => {
    const snap = createSnapshot(makeInput({
      files: [
        { path: "a.ts", content: "abc", size: 100 },
        { path: "b.ts", content: "def", size: 200 },
      ],
    }));
    expect(snap.total_size_bytes).toBe(300);
    expect(snap.file_count).toBe(2);
  });
});
