import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

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
        console.error("Route handler error:", err);
        if (!res.writableEnded) {
          sendJSON(res, 500, { error: "Internal server error" });
        }
      }
      return;
    }

    sendJSON(res, 404, { error: "Not found" });
  }
}

export function sendJSON(res: ServerResponse, status: number, data: unknown) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
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
    // CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    router.handle(req, res);
  });

  server.listen(port, () => {
    console.log(`Axis API running on http://localhost:${port}`);
  });

  return server;
}
