import type { IncomingMessage, ServerResponse } from "node:http";
import { getDbStats, integrityCheck } from "@axis/snapshots";
import { isShuttingDown } from "./router.js";

const startTime = Date.now();

// ─── Counters ───────────────────────────────────────────────────

let requestCount = 0;
let errorCount = 0;
const statusCounts: Record<string, number> = {};

export function recordRequest(statusCode: number): void {
  requestCount++;
  if (statusCode >= 500) errorCount++;
  const bucket = `${Math.floor(statusCode / 100)}xx`;
  statusCounts[bucket] = (statusCounts[bucket] ?? 0) + 1;
}

// ─── Readiness / Liveness ───────────────────────────────────────

export async function handleLiveness(
  _req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  // Liveness: is the process responsive?
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ status: "alive" }));
}

export async function handleReadiness(
  _req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  // Readiness: is the service ready to accept traffic?
  const shutting = isShuttingDown();
  const dbCheck = integrityCheck();
  const ready = !shutting && dbCheck.success;

  res.writeHead(ready ? 200 : 503, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      status: ready ? "ready" : "not_ready",
      checks: {
        shutting_down: shutting,
        database: dbCheck.success ? "ok" : "error",
      },
    }),
  );
}

// ─── Prometheus-compatible metrics ──────────────────────────────

export async function handleMetrics(
  _req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  const mem = process.memoryUsage();
  const dbStats = getDbStats();
  const tables = (dbStats.details?.tables ?? {}) as Record<string, number>;

  const lines: string[] = [];

  // Process metrics
  lines.push("# HELP axis_uptime_seconds Time since server start");
  lines.push("# TYPE axis_uptime_seconds gauge");
  lines.push(`axis_uptime_seconds ${uptime}`);

  lines.push("# HELP axis_requests_total Total HTTP requests");
  lines.push("# TYPE axis_requests_total counter");
  lines.push(`axis_requests_total ${requestCount}`);

  lines.push("# HELP axis_errors_total Total 5xx responses");
  lines.push("# TYPE axis_errors_total counter");
  lines.push(`axis_errors_total ${errorCount}`);

  for (const [bucket, count] of Object.entries(statusCounts)) {
    lines.push(`axis_http_responses_total{status="${bucket}"} ${count}`);
  }

  lines.push("# HELP axis_memory_rss_bytes Resident set size");
  lines.push("# TYPE axis_memory_rss_bytes gauge");
  lines.push(`axis_memory_rss_bytes ${mem.rss}`);

  lines.push("# HELP axis_memory_heap_used_bytes V8 heap used");
  lines.push("# TYPE axis_memory_heap_used_bytes gauge");
  lines.push(`axis_memory_heap_used_bytes ${mem.heapUsed}`);

  lines.push("# HELP axis_memory_heap_total_bytes V8 heap total");
  lines.push("# TYPE axis_memory_heap_total_bytes gauge");
  lines.push(`axis_memory_heap_total_bytes ${mem.heapTotal}`);

  // Database metrics
  if (dbStats.success) {
    const sizeBytes = dbStats.details.size_bytes as number;
    lines.push("# HELP axis_db_size_bytes Database file size");
    lines.push("# TYPE axis_db_size_bytes gauge");
    lines.push(`axis_db_size_bytes ${sizeBytes}`);

    for (const [table, count] of Object.entries(tables)) {
      lines.push(`axis_db_table_rows{table="${table}"} ${count}`);
    }
  }

  res.writeHead(200, { "Content-Type": "text/plain; version=0.0.4; charset=utf-8" });
  res.end(lines.join("\n") + "\n");
}
