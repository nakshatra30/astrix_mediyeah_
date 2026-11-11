/**
 * Interactive CLI that creates an Admin user.
 * - Prompts for name, email, and a hidden password (entered twice).
 * - Passwords are hashed with bcrypt before storage; nothing is logged.
 * - Refuses to run with NODE_ENV=production.
 */
import readline from "node:readline/promises";
import bcrypt from "bcrypt";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";

if (env.isProduction) {
  console.error("Refusing to create an admin while NODE_ENV=production. Use a development environment.");
  process.exit(1);
}

function promptPassword(label: string): Promise<string> {
  process.stdout.write(`${label}`);
  return new Promise((resolve) => {
    if (process.stdin.setRawMode === undefined) {
      // Non-TTY fallback (piped input) — cannot hide characters.
      process.stdout.write("\n");
      const chunks: Buffer[] = [];
      process.stdin.once("data", (chunk: string | Buffer) => {
        chunks.push(Buffer.from(chunk));
        resolve(Buffer.concat(chunks).toString("utf8").trim());
      });
      process.stdin.resume();
      return;
    }
    const stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    let value = "";
    const onData = (chunk: Buffer): void => {
      for (const byte of chunk) {
        if (byte === 13 || byte === 10) {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off("data", onData);
          process.stdout.write("\n");
          resolve(value);
          return;
        }
        if (byte === 3) {
          // Ctrl+C
          process.stdout.write("\n");
          process.exit(1);
        }
        if (byte === 8 || byte === 127) {
          if (value.length > 0) {
            value = value.slice(0, -1);
            process.stdout.write("\b \b");
          }
          continue;
        }
        if (byte >= 32 && byte < 127) {
          value += String.fromCharCode(byte);
          process.stdout.write("*");
        }
      }
    };
    stdin.on("data", onData);
  });
}

async function main(): Promise<void> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  const name = (await rl.question("Admin name [Astrix Admin]: ")).trim() || "Astrix Admin";
  const emailInput = (await rl.question("Admin email [astrix.mediyeah@gmail.com]: ")).trim().toLowerCase();
  const email = emailInput === "" ? "astrix.mediyeah@gmail.com" : emailInput;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error(`"${email}" is not a valid email address.`);
    rl.close();
    process.exit(1);
  }

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing !== null) {
    console.error(`An admin with email ${email} already exists (id: ${existing.id}).`);
    rl.close();
    process.exit(1);
  }

  rl.close();

  const password = await promptPassword("Password (min 10 chars, hidden): ");
  const passwordConfirmation = await promptPassword("Confirm password: ");

  if (password.length < 10) {
    console.error("Password must be at least 10 characters.");
    process.exit(1);
  }
  if (Buffer.byteLength(password, "utf8") > 72) {
    console.error("Password must be at most 72 bytes.");
    process.exit(1);
  }
  if (password !== passwordConfirmation) {
    console.error("Passwords do not match.");
    process.exit(1);
  }
  if (password.includes(email)) {
    console.error("Password must not contain the email address.");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, env.bcryptRounds);
  const user = await prisma.adminUser.create({
    data: { name, email, passwordHash },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  console.log(`\nAdmin created:`);
  console.log(`  id:    ${user.id}`);
  console.log(`  name:  ${user.name}`);
  console.log(`  email: ${user.email}`);
  console.log(`\nStore this password in your secrets manager; it cannot be recovered.`);
}

main()
  .catch((err) => {
    console.error("Failed to create admin:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => {
    prisma.$disconnect().catch(() => undefined);
  });
