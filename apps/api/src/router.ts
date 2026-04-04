import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { initRequest, getRequestId, getRequestStart, log, type ErrorCodeValue } from "./logger.js";
import { checkRateLimit } from "./rate-limiter.js";

type RouteHandler = (req: IncomingMessage, res: ServerResponse, params: Record<string, string>) => Promise<void>;

interface Route {
  method: string;
  pattern: RegExp;
  paramNames: string[];
  handler: RouteHandler;
}

export class Router {
  private routes: Route[] = [];

  post(path: string, handler: RouteHandler) {
    this.addRoute("POST", path, handler);
  }

  get(path: string, handler: RouteHandler) {
    this.addRoute("GET", path, handler);
  }

  private addRoute(method: string, path: string, handler: RouteHandler) {
    const paramNames: string[] = [];
    const pattern = path.replace(/:(\w+)(\*)?/g, (_, name, wildcard) => {
      paramNames.push(name);
      return wildcard ? "(.+)" : "([^/]+)";
    });
    this.routes.push({
      method,
      pattern: new RegExp(`^${pattern}$`),
      paramNames,
      handler,
    });
  }

  async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
    const method = req.method ?? "GET";

    for (const route of this.routes) {
      if (route.method !== method) continue;
      const match = url.pathname.match(route.pattern);
      if (!match) continue;

      const params: Record<string, string> = {};
      route.paramNames.forEach((name, i) => {
        params[name] = match[i + 1];
      });

      try {
        await route.handler(req, res, params);
      } catch (err) {
        log("error", "route_handler_error", {
          request_id: getRequestId(res),
          path: req.url,
          error: err instanceof Error ? err.message : String(err),
        });
        if (!res.writableEnded) {
          sendError(res, 500, "INTERNAL_ERROR", "Internal server error");
        }
      }
      return;
    }

    sendError(res, 404, "NOT_FOUND", "Not found");
  }
}

export function sendJSON(res: ServerResponse, status: number, data: unknown) {
  const requestId = getRequestId(res);
  // Auto-inject request_id into error responses
  const payload = status >= 400 && requestId && typeof data === "object" && data !== null
    ? { ...(data as Record<string, unknown>), request_id: requestId }
    : data;
  if (requestId && !res.headersSent) {
    res.setHeader("X-Request-Id", requestId);
  }
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
}

export function sendError(
  res: ServerResponse,
  status: number,
  errorCode: ErrorCodeValue | string,
  message: string,
  extra?: Record<string, unknown>,
) {
  sendJSON(res, status, { error: message, error_code: errorCode, ...extra });
}

export async function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let totalSize = 0;
    let settled = false;
    const maxSize = 50 * 1024 * 1024; // 50MB limit

    req.on("data", (chunk: Buffer) => {
      totalSize += chunk.length;
      if (totalSize > maxSize) {
        req.destroy();
        if (!settled) { settled = true; reject(new Error("Request body too large")); }
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => { if (!settled) { settled = true; resolve(Buffer.concat(chunks).toString("utf-8")); } });
    req.on("error", (err) => { if (!settled) { settled = true; reject(err); } });
    req.on("close", () => { if (!settled) { settled = true; reject(new Error("Request closed prematurely")); } });
  });
}

export function createApp(router: Router, port: number) {
  const server = createServer((req, res) => {
    // Request ID + timing
    const requestId = initRequest(res);
    res.setHeader("X-Request-Id", requestId);

    // Security headers (OWASP)
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Content-Security-Policy", "default-src 'self'");
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    res.setHeader("X-XSS-Protection", "0");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

    // CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    // Rate limiting (before route handling)
    if (!checkRateLimit(req, res)) return;

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    // Log after response completes
    res.on("finish", () => {
      const start = getRequestStart(res);
      const duration = start ? Date.now() - start : undefined;
      const level = (res.statusCode ?? 200) >= 500 ? "error" as const
        : (res.statusCode ?? 200) >= 400 ? "warn" as const
        : "info" as const;
      log(level, "request", {
        request_id: requestId,
        method: req.method,
        path: req.url,
        status: res.statusCode,
        duration_ms: duration,
      });
    });

    router.handle(req, res);
  });

  server.listen(port, () => {
    log("info", "server_start", { port, service: "axis-api" });
  });

  return server;
}
