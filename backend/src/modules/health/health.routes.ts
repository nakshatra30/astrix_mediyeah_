import { Router } from "express";
import { prisma } from "../../config/prisma.js";
import { sendData } from "../../utils/api.js";

const SERVICE_NAME = "astrix-media-api";
const SERVICE_VERSION = "1.0.0";

export const healthRouter = Router();

healthRouter.get("/", async (_req, res) => {
  let database = "up";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    database = "down";
  }
  sendData(res, {
    status: "ok",
    service: SERVICE_NAME,
    version: SERVICE_VERSION,
    database,
    time: new Date().toISOString(),
  });
});
