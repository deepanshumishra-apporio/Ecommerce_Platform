import type { Response } from "express";
import { asyncHandler } from "../lib/async-handler.js";
import * as reviewService from "../services/review.service.js";
import type { AuthenticatedRequest } from "../types/api.js";
import { sendSuccess } from "../utils/response.js";

export const createReview = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const review = await reviewService.createReview(req.dbUser!.id, req.body);
  return sendSuccess(res, review, "Review created", 201);
});

export const checkCanReview = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await reviewService.canReview(req.dbUser!.id, String(req.params.productId));
  return sendSuccess(res, result, "OK");
});
