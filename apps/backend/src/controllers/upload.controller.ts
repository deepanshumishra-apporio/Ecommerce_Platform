import type { Response } from "express";
import { asyncHandler } from "../lib/async-handler.js";
import { imagekitClient } from "../lib/imagekit.js";
import { deleteFileFromR2, uploadFileToR2 } from "../services/upload.service.js";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import { AppError } from "../utils/app-error.js";
import { sendSuccess } from "../utils/response.js";

/**
 * POST /api/v1/upload
 * Accepts a single file (field name: "file").
 * Admin only.
 */
export const uploadFile = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const file = req.file;

    if (!file) {
      throw new AppError("No file provided. Send a file via the 'file' field.", 400);
    }

    const uploaded = await uploadFileToR2(file);

    return sendSuccess(res, uploaded, "File uploaded successfully.", 201);
  },
);

/**
 * POST /api/v1/upload/batch
 * Accepts up to 10 files (field name: "files").
 * Admin only.
 */
export const uploadFiles = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const files = req.files as Express.Multer.File[] | undefined;

    if (!files || files.length === 0) {
      throw new AppError("No files provided. Send files via the 'files' field.", 400);
    }

    // Upload all files in parallel
    const uploaded = await Promise.all(files.map((f) => uploadFileToR2(f)));

    return sendSuccess(res, uploaded, `${uploaded.length} file(s) uploaded successfully.`, 201);
  },
);

/**
 * POST /api/v1/upload/imagekit
 * Accepts up to 5 files (field name: "files"), uploads to ImageKit.
 * Returns an array of URLs.
 * Admin only.
 */
export const uploadFilesToImageKit = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const files = req.files as Express.Multer.File[] | undefined;

    if (!files || files.length === 0) {
      throw new AppError("No files provided. Send files via the 'files' field.", 400);
    }
    if (files.length > 5) {
      throw new AppError("Maximum 5 files allowed per upload.", 400);
    }

    const urls = await Promise.all(
      files.map(async (f) => {
        const base64 = f.buffer.toString("base64");
        const result = await imagekitClient.upload({
          file: base64,
          fileName: f.originalname,
          folder: "/ecommerce",
        });
        return result.url;
      }),
    );

    return sendSuccess(res, urls, `${urls.length} file(s) uploaded to ImageKit.`, 201);
  },
);

/**
 * DELETE /api/v1/upload
 * Body: { key: string }
 * Deletes a file from R2 by its object key.
 * Admin only.
 */
export const deleteFile = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { key } = req.body as { key?: string };

    if (!key || typeof key !== "string" || key.trim() === "") {
      throw new AppError("A valid 'key' string is required in the request body.", 400);
    }

    await deleteFileFromR2(key.trim());

    return sendSuccess(res, { key: key.trim() }, "File deleted successfully.");
  },
);
