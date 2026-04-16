import { requireAuth } from "@clerk/express";
import { Router } from "express";
import { authWebhook, getMe } from "../controllers/auth.controller.js";

export const authRouter = Router();

authRouter.post("/webhook", authWebhook);
authRouter.get("/me", requireAuth(), getMe);
