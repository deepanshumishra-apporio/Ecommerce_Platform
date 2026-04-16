import { Router } from "express";
import { deleteFile, uploadFile, uploadFiles, uploadFilesToImageKit } from "../controllers/upload.controller.js";
import { asyncHandler } from "../lib/async-handler.js";
import { uploadMiddleware } from "../middlewares/multer.js";
import { requireAdmin } from "../middlewares/require-admin.js";
import { requireDbUser } from "../middlewares/require-db-user.js";

export const uploadRouter = Router();

// All upload routes require an authenticated admin
const adminGuard = [...requireDbUser, requireAdmin];

/**
 * POST /api/v1/upload
 * Single file upload — field name: "file"
 */
uploadRouter.post(
  "/",
  adminGuard,
  uploadMiddleware.single("file"),
  uploadFile,
);

/**
 * POST /api/v1/upload/batch
 * Batch upload (up to 10 files) — field name: "files"
 */
uploadRouter.post(
  "/batch",
  adminGuard,
  uploadMiddleware.array("files", 10),
  uploadFiles,
);

/**
 * POST /api/v1/upload/imagekit
 * Batch upload to ImageKit (up to 5 files) — field name: "files"
 */
uploadRouter.post(
  "/imagekit",
  adminGuard,
  uploadMiddleware.array("files", 5),
  uploadFilesToImageKit,
);

/**
 * DELETE /api/v1/upload
 * Delete a file from R2 by object key
 * Body: { key: string }
 */
uploadRouter.delete(
  "/",
  adminGuard,
  asyncHandler(async (req, res, next) => {
    // parse JSON body — already done by express.json() in app.ts
    return next();
  }),
  deleteFile,
);
