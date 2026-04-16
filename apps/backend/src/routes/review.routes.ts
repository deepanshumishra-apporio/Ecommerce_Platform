import { Router } from "express";
import * as reviewController from "../controllers/review.controller.js";
import { requireDbUser } from "../middlewares/require-db-user.js";
import { validate } from "../middlewares/validate.js";
import { createReviewSchema } from "../validations/review.validation.js";

export const reviewRouter = Router();

reviewRouter.get("/can-review/:productId", requireDbUser, reviewController.checkCanReview);
reviewRouter.post("/", requireDbUser, validate(createReviewSchema), reviewController.createReview);
