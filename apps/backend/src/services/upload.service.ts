import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import { extname } from "node:path";
import { env } from "../config/env.js";
import { r2Client } from "../lib/r2.js";
import { AppError } from "../utils/app-error.js";

// ── Allowed MIME types & per-type size caps ────────────────────────────────

export const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

export const ALLOWED_VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime", // .mov
  "video/x-msvideo", // .avi
]);

export const ALLOWED_MIME_TYPES = new Set([
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_VIDEO_TYPES,
]);

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;  // 10 MB
const MAX_VIDEO_BYTES = 500 * 1024 * 1024; // 500 MB

// ── Types ──────────────────────────────────────────────────────────────────

export type UploadedFile = {
  key: string;
  url: string;
  originalName: string;
  mimeType: string;
  size: number;
  mediaType: "image" | "video";
};

// ── Helpers ────────────────────────────────────────────────────────────────

function resolveMediaType(mimeType: string): "image" | "video" {
  if (ALLOWED_IMAGE_TYPES.has(mimeType)) return "image";
  if (ALLOWED_VIDEO_TYPES.has(mimeType)) return "video";
  throw new AppError("Unsupported media type.", 415);
}

function buildObjectKey(originalName: string, mimeType: string): string {
  const mediaType = resolveMediaType(mimeType);
  const ext = extname(originalName).toLowerCase() || ".bin";
  const id = randomUUID();
  // e.g. images/2024/abc123.webp  or  videos/2024/abc123.mp4
  const year = new Date().getFullYear();
  return `${mediaType}s/${year}/${id}${ext}`;
}

// ── Upload ─────────────────────────────────────────────────────────────────

export async function uploadFileToR2(file: Express.Multer.File): Promise<UploadedFile> {
  const { mimetype, size, originalname, buffer } = file;

  if (!ALLOWED_MIME_TYPES.has(mimetype)) {
    throw new AppError(
      `File type "${mimetype}" is not allowed. Accepted: JPEG, PNG, WebP, GIF, AVIF, MP4, WebM, MOV, AVI.`,
      415,
    );
  }

  const mediaType = resolveMediaType(mimetype);
  const maxBytes = mediaType === "image" ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;

  if (size > maxBytes) {
    const limitMB = Math.round(maxBytes / 1024 / 1024);
    throw new AppError(`${mediaType} exceeds the ${limitMB} MB size limit.`, 413);
  }

  const key = buildObjectKey(originalname, mimetype);

  await r2Client.send(
    new PutObjectCommand({
      Bucket: env.CLOUDFLARE_R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
      ContentLength: size,
      // CacheControl for browser/CDN efficiency
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );

  const url = `${env.CLOUDFLARE_R2_PUBLIC_URL}/${key}`;

  return { 
    key, 
    url, 
    originalName: originalname, 
    mimeType: mimetype, 
    size, 
    mediaType 
  };
}

// ── Delete ─────────────────────────────────────────────────────────────────

export async function deleteFileFromR2(key: string): Promise<void> {
  if (!key || key.trim() === "") {
    throw new AppError("A valid object key is required to delete a file.", 400);
  }

  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: env.CLOUDFLARE_R2_BUCKET_NAME,
      Key: key,
    }),
  );
}
