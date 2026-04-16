import multer from "multer";
import { ALLOWED_MIME_TYPES } from "../services/upload.service.js";
import { AppError } from "../utils/app-error.js";

/**
 * Memory storage — files are kept as Buffer in memory so we can stream
 * them directly to R2 without touching the filesystem. For large video
 * files you would swap this for a stream-based approach, but for uploads
 * up to 500 MB this is straightforward and avoids tmp-file cleanup.
 */
const storage = multer.memoryStorage();

export const uploadMiddleware = multer({
  storage,
  limits: {
    // Hard cap at 500 MB — the service layer enforces per-type limits.
    fileSize: 500 * 1024 * 1024,
    files: 10, // max 10 files per request
  },
  fileFilter(_req, file, callback) {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return callback(
        new AppError(
          `File type "${file.mimetype}" is not allowed.`,
          415,
        ) as unknown as null,
        false,
      );
    }
    return callback(null, true);
  },
});
