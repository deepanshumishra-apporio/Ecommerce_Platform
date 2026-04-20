import { Router } from "express";
import * as couponController from "../controllers/coupon.controller.js";
import { AdminMiddleware } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.js";
import { applyCouponSchema, createCouponSchema } from "../validations/coupon.validation.js";

export const couponRouter = Router();

couponRouter.post("/apply", validate(applyCouponSchema), couponController.applyCoupon);
couponRouter.post("/", AdminMiddleware, validate(createCouponSchema), couponController.createCoupon);
couponRouter.get("/", AdminMiddleware, couponController.getCoupons);
