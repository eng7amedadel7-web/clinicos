import express from "express";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { describe, expect, it } from "vitest";
import router from "../health";

function buildApp() {
  const app = express();
  app.use(router);
  return app;
}

async function withServer(run: (base: string) => Promise<void>) {
  const app = buildApp();
  const server: Server = app.listen(0);
  await new Promise<void>((resolve) => server.once("listening", () => resolve()));
  const port = (server.address() as AddressInfo).port;
  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

describe("health route", () => {
  it("returns 200 with a schema-valid status payload", async () => {
    await withServer(async (base) => {
      const res = await fetch(`${base}/healthz`);
      expect(res.status).toBe(200);
      const body = (await res.json()) as { status?: string };
      expect(body.status).toBe("ok");
    });
  });

  it("does not expose internals in the response", async () => {
    await withServer(async (base) => {
      const res = await fetch(`${base}/healthz`);
      const body = (await res.json()) as Record<string, unknown>;
      expect(Object.keys(body)).toEqual(["status"]);
    });
  });
});
