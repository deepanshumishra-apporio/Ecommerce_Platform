import { Router } from "express";
import * as couponController from "../controllers/coupon.controller.js";
import { requireAdmin } from "../middlewares/require-admin.js";
import { requireDbUser } from "../middlewares/require-db-user.js";
import { validate } from "../middlewares/validate.js";
import { applyCouponSchema, createCouponSchema } from "../validations/coupon.validation.js";

export const couponRouter = Router();

couponRouter.post("/apply", validate(applyCouponSchema), couponController.applyCoupon);
couponRouter.post("/", requireDbUser, requireAdmin, validate(createCouponSchema), couponController.createCoupon);
couponRouter.get("/", requireDbUser, requireAdmin, couponController.getCoupons);
