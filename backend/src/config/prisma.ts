import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import { env } from "./env.js";

const adapter = new PrismaPg({ connectionString: env.databaseUrl });

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
