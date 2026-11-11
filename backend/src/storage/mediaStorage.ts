import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { v2 as cloudinary } from "cloudinary";
import { env, isCloudinaryConfigured, publicBaseUrl } from "../config/env.js";
import { stripControlChars } from "../utils/sanitize.js";
import type { ImageInfo } from "../utils/images.js";

const MAX_FILENAME_LENGTH = 180;

export interface StoredMedia {
  filename: string;
  publicId: string;
  url: string;
  secureUrl: string;
  mimeType: string;
  byteSize: number;
  width: number;
  height: number;
  storage: "cloudinary" | "local";
}

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const uploadsDir = path.join(backendRoot, "uploads");

function safeFilename(original: string): string {
  const base = path.basename(original).replace(/[^A-Za-z0-9._-]/g, "_").slice(0, MAX_FILENAME_LENGTH);
  return base === "" || base === "." ? "upload" : stripControlChars(base);
}

/**
 * Stores an image buffer. Uses Cloudinary when configured; otherwise falls
 * back to local disk under backend/uploads (development convenience —
 * the folder is gitignored and served read-only at /uploads).
 */
export async function storeImage(buffer: Buffer, originalFilename: string, info: ImageInfo): Promise<StoredMedia> {
  const filename = safeFilename(originalFilename);

  if (isCloudinaryConfigured()) {
    cloudinary.config({
      cloud_name: env.cloudinary.cloudName,
      api_key: env.cloudinary.apiKey,
      api_secret: env.cloudinary.apiSecret,
      secure: true,
    });
    const uploaded = await new Promise<{ public_id: string; secure_url: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: "image", folder: env.cloudinary.folder },
        (error, result) => {
          if (error !== undefined || result === undefined) {
            reject(error ?? new Error("Cloudinary upload failed"));
          } else {
            resolve({ public_id: result.public_id, secure_url: result.secure_url });
          }
        },
      );
      stream.end(buffer);
    });
    return {
      filename,
      publicId: uploaded.public_id,
      url: uploaded.secure_url,
      secureUrl: uploaded.secure_url,
      mimeType: info.mimeType,
      byteSize: buffer.byteLength,
      width: info.width,
      height: info.height,
      storage: "cloudinary",
    };
  }

  const extension = EXTENSION_BY_MIME[info.mimeType] ?? ".bin";
  const id = randomUUID();
  const diskFilename = `${id}${extension}`;
  await mkdir(uploadsDir, { recursive: true });
  await writeFile(path.join(uploadsDir, diskFilename), buffer);
  const url = `${publicBaseUrl()}/uploads/${diskFilename}`;
  return {
    filename,
    publicId: `local/${id}`,
    url,
    secureUrl: url,
    mimeType: info.mimeType,
    byteSize: buffer.byteLength,
    width: info.width,
    height: info.height,
    storage: "local",
  };
}

/** Removes the underlying stored object. Best-effort: DB row removal is authoritative. */
export async function deleteStoredMedia(media: { publicId: string; storage: string; url: string }): Promise<void> {
  if (media.storage === "cloudinary" && isCloudinaryConfigured()) {
    await cloudinary.uploader.destroy(media.publicId, { resource_type: "image" }).catch(() => undefined);
    return;
  }
  if (media.storage === "local") {
    const basename = media.url.split("/").pop();
    if (basename === undefined || basename.includes("/") || basename.includes("\\")) return;
    await unlink(path.join(uploadsDir, basename)).catch(() => undefined);
  }
}
