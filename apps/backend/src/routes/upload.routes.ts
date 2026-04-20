import { Router } from "express";
import { deleteFile, uploadFile, uploadFiles, uploadFilesToImageKit } from "../controllers/upload.controller.js";
import { AdminMiddleware } from "../middlewares/auth.middleware.js";
import { uploadMiddleware } from "../middlewares/multer.js";

export const uploadRouter = Router();

uploadRouter.post("/", AdminMiddleware, uploadMiddleware.single("file"), uploadFile);
uploadRouter.post("/batch", AdminMiddleware, uploadMiddleware.array("files", 10), uploadFiles);
uploadRouter.post("/imagekit", AdminMiddleware, uploadMiddleware.array("files", 5), uploadFilesToImageKit);
uploadRouter.delete("/", AdminMiddleware, deleteFile);
