import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../helpers.js";

describe("GET /api/v1/health", () => {
  it("returns an ok envelope with service identity and db status", async () => {
    const res = await request(app).get("/api/v1/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: expect.objectContaining({
        status: "ok",
        service: "astrix-media-api",
        database: "up",
        time: expect.any(String),
      }),
    });
  });
});
