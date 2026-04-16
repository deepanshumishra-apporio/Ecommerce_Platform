import type { Request, Response } from "express";
import { asyncHandler } from "../lib/async-handler.js";
import * as adminService from "../services/admin.service.js";
import { sendSuccess } from "../utils/response.js";

export const getDashboard = asyncHandler(async (_req: Request, res: Response) => {
  const dashboard = await adminService.getDashboard();
  return sendSuccess(res, dashboard, "Dashboard fetched");
});

export const getOrders = asyncHandler(async (_req: Request, res: Response) => {
  const orders = await adminService.getAdminOrders();
  return sendSuccess(res, orders, "Admin orders fetched");
});

export const getUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = await adminService.getAdminUsers();
  return sendSuccess(res, users, "Admin users fetched");
});

export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const { status } = req.body as { status: string };
  const VALID = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];
  if (!VALID.includes(status)) throw new Error("Invalid status");
  const order = await adminService.updateOrderStatus(id, status);
  return sendSuccess(res, order, "Order status updated");
});
