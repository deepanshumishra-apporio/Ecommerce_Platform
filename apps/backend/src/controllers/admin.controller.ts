import type { Request, Response } from "express";
import { asyncHandler } from "../lib/async-handler.js";
import * as adminService from "../services/admin.service.js";
import { AppError } from "../utils/app-error.js";
import { sendSuccess } from "../utils/response.js";

export const checkAdmin = asyncHandler(async (_req: Request, res: Response) => {

  return sendSuccess(
    res, {
    isAdmin: true
  },
    "Admin access confirmed"
  );

});

export const getAdminDashboard = asyncHandler(async (_req: Request, res: Response) => {

  const dashboard = await adminService.getDashboard();

  return sendSuccess(
    res,
    dashboard,
    "Dashboard fetched"
  );

});

export const getAllOrders = asyncHandler(async (_req: Request, res: Response) => {

  const orders = await adminService.getAdminOrders();

  return sendSuccess(
    res,
    orders,
    "All orders fetched"
  );

});

export const getAllUsers = asyncHandler(async (_req: Request, res: Response) => {

  const users = await adminService.getAdminUsers();

  return sendSuccess(
    res,
    users,
    "All users fetched"
  );

});

export const adminUpdateOrderStatus = asyncHandler(async (req: Request, res: Response) => {

  const { id } = req.params as { id: string };

  const { status } = req.body as { status: string };

  const VALID = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];

  if (!VALID.includes(status)) throw new AppError("Invalid status", 400);

  const order = await adminService.updateOrderStatus(id, status);

  return sendSuccess(
    res,
    order,
    "Order status updated"
  );

});