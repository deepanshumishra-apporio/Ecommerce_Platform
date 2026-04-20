import { Router } from "express";
import * as reviewController from "../controllers/review.controller.js";
import { UserMiddleware } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.js";
import { createReviewSchema } from "../validations/review.validation.js";

export const reviewRouter = Router();

reviewRouter.get("/can-review/:productId", UserMiddleware, reviewController.checkCanReview);
reviewRouter.post("/", UserMiddleware, validate(createReviewSchema), reviewController.createReview);
