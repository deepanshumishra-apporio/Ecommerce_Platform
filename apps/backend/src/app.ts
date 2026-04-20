import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { apiRouter } from "./routes/index.js";
import { env } from "./config/env.js";
import { errorHandler } from "./middlewares/error-handler.js";
import { notFoundHandler } from "./middlewares/not-found-handler.js";
import { sanitizeBody } from "./middlewares/sanitize.js";

export const app = express();

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  }),
);

app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeBody);

app.get("/health", (_req, res) => {
  res.status(200).json({ success: true, message: "OK" });
});

app.use("/api/v1", apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);
