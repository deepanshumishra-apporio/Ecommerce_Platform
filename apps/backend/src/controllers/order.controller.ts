import type { Response } from "express";
import { asyncHandler } from "../lib/async-handler.js";
import * as orderService from "../services/order.service.js";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import { sendSuccess } from "../utils/response.js";

export const createOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const order = await orderService.createOrder(req.userId!, req.body);
  return sendSuccess(res, order, "Order created", 201);
});

export const getMyOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
  const orders = await orderService.getUserOrders(req.userId!);
  return sendSuccess(res, orders, "Orders fetched");
});

export const getMyOrderById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const order = await orderService.getOrderById(String(req.params.id), req.userId!);
  return sendSuccess(res, order, "Order fetched");
});
