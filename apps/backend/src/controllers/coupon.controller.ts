import type { Request, Response } from "express";
import { asyncHandler } from "../lib/async-handler.js";
import * as couponService from "../services/coupon.service.js";
import { sendSuccess } from "../utils/response.js";

export const applyCoupon = asyncHandler(async (req: Request, res: Response) => {
  const result = await couponService.applyCoupon(String(req.body.code), Number(req.body.totalAmount));
  return sendSuccess(res, result, "Coupon applied");
});

export const createCoupon = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await couponService.createCoupon(req.body);
  return sendSuccess(res, coupon, "Coupon created", 201);
});

export const getCoupons = asyncHandler(async (_req: Request, res: Response) => {
  const coupons = await couponService.listCoupons();
  return sendSuccess(res, coupons, "Coupons fetched");
});
