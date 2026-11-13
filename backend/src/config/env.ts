import "dotenv/config";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value.trim() === "") {
    throw new Error(
      `Missing required environment variable: ${name}. Copy backend/.env.example to backend/.env and configure it.`,
    );
  }
  return value.trim();
}

function optionalEnv(name: string, fallback: string): string {
  const value = process.env[name];
  return value !== undefined && value.trim() !== "" ? value.trim() : fallback;
}

function parsePositiveInt(name: string, fallback: string): number {
  const parsed = Number.parseInt(optionalEnv(name, fallback), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Environment variable ${name} must be a positive integer.`);
  }
  return parsed;
}

const nodeEnv = process.env.NODE_ENV?.trim() || "development";

export const env = {
  nodeEnv,
  isProduction: nodeEnv === "production",
  isTest: nodeEnv === "test",
  port: parsePositiveInt("PORT", "5000"),
  databaseUrl: requireEnv("DATABASE_URL"),
  sessionSecret: requireEnv("SESSION_SECRET"),
  sessionCookieName: optionalEnv("SESSION_COOKIE_NAME", "astrix.sid"),
  sessionTtlHours: parsePositiveInt("SESSION_TTL_HOURS", "8"),
  bcryptRounds: parsePositiveInt("BCRYPT_ROUNDS", "12"),
  clientUrl: optionalEnv("CLIENT_URL", "http://localhost:5173").replace(/\/+$/, ""),
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME?.trim() || "",
    apiKey: process.env.CLOUDINARY_API_KEY?.trim() || "",
    apiSecret: process.env.CLOUDINARY_API_SECRET?.trim() || "",
    folder: optionalEnv("CLOUDINARY_FOLDER", "astrix-media"),
  },
} as const;

export function publicBaseUrl(): string {
  const configured = process.env.PUBLIC_BASE_URL?.trim() ?? "";
  if (configured !== "") return configured.replace(/\/+$/, "");
  // Production serves the SPA from this service, so the client URL is the
  // public base (matters only for the local-disk media fallback; Cloudinary
  // URLs are absolute already).
  if (env.isProduction) return env.clientUrl.replace(/\/+$/, "");
  return `http://localhost:${env.port}`;
}

export function isCloudinaryConfigured(): boolean {
  return Boolean(env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret);
}
