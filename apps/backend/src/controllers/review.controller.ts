import type { Response } from "express";
import { asyncHandler } from "../lib/async-handler.js";
import * as reviewService from "../services/review.service.js";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import { sendSuccess } from "../utils/response.js";

export const createReview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const review = await reviewService.createReview(req.userId!, req.body);
  return sendSuccess(res, review, "Review created", 201);
});

export const checkCanReview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await reviewService.canReview(req.userId!, String(req.params.productId));
  return sendSuccess(res, result, "OK");
});
