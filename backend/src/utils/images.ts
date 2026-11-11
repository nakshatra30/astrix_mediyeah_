import { imageSize } from "image-size";
import { ApiError } from "./api.js";

const MIME_BY_DETECTED_TYPE: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
};

export interface ImageInfo {
  width: number;
  height: number;
  mimeType: string;
}

/**
 * Validates an uploaded image by sniffing magic bytes — never trusting the
 * client-declared Content-Type. Throws 415 for anything that is not a
 * supported raster image (png / jpeg / webp / gif).
 */
export function detectImage(buffer: Buffer): ImageInfo {
  let parsed;
  try {
    parsed = imageSize(buffer);
  } catch {
    throw new ApiError(415, "UNSUPPORTED_MEDIA_TYPE", "Uploaded file is not a valid image");
  }
  const mimeType = parsed.type ? MIME_BY_DETECTED_TYPE[parsed.type] : undefined;
  if (
    mimeType === undefined ||
    typeof parsed.width !== "number" ||
    typeof parsed.height !== "number" ||
    parsed.width <= 0 ||
    parsed.height <= 0
  ) {
    throw new ApiError(415, "UNSUPPORTED_MEDIA_TYPE", "Uploaded file must be a png, jpeg, webp, or gif image");
  }
  return { width: parsed.width, height: parsed.height, mimeType };
}
