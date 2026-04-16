import type { Response } from "express";
import { asyncHandler } from "../lib/async-handler.js";
import * as orderService from "../services/order.service.js";
import type { AuthenticatedRequest } from "../types/api.js";
import { sendSuccess } from "../utils/response.js";

export const createOrder = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const order = await orderService.createOrder(req.dbUser!.id, req.body);
  return sendSuccess(res, order, "Order created", 201);
});

export const getOrders = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const orders = await orderService.getUserOrders(req.dbUser!.id);
  return sendSuccess(res, orders, "Orders fetched");
});

export const getOrder = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const order = await orderService.getOrderById(
    String(req.params.id),
    req.dbUser!.id,
    req.dbUser!.role === "ADMIN",
  );
  return sendSuccess(res, order, "Order fetched");
});

export const updateOrderStatus = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const order = await orderService.updateOrderStatus(String(req.params.id), String(req.body.status));
    return sendSuccess(res, order, "Order status updated");
  },
);
