import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import { env } from "./env.js";

const pool = new pg.Pool({
  connectionString: env.databaseUrl,
  max: env.isProduction ? 5 : 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter,
  transactionOptions: {
    // A cold connection to Neon (TCP+TLS+auth) can take ~3s on this network,
    // which exceeds the default maxWait of 2s and makes every $transaction
    // fail with P2028 "Unable to start a transaction in the given time".
    maxWait: 15000,
    timeout: 15000,
  },
});

