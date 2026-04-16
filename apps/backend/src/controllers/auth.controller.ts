import { getAuth } from "@clerk/express";
import { verifyWebhook } from "@clerk/express/webhooks";
import type { Request, Response } from "express";
import { asyncHandler } from "../lib/async-handler.js";
import { getCurrentDbUser, handleClerkWebhook } from "../services/auth.service.js";
import { AppError } from "../utils/app-error.js";
import { sendSuccess } from "../utils/response.js";

export const authWebhook = asyncHandler(async (req: Request, res: Response) => {
  let event;

  try {
    event = await verifyWebhook(req);
  } catch {
    throw new AppError("Invalid Clerk webhook signature", 400);
  }

  const result = await handleClerkWebhook(event);

  return sendSuccess(res, result, "Webhook processed");
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = getAuth(req);
  const user = await getCurrentDbUser(userId!);

  return sendSuccess(res, user, "Current user fetched");
});
