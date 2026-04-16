import type { Response } from "express";
import { asyncHandler } from "../lib/async-handler.js";
import * as paymentService from "../services/payment.service.js";
import type { AuthenticatedRequest } from "../types/api.js";
import { sendSuccess } from "../utils/response.js";

export const createPayment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const payment = await paymentService.createPaymentOrder(String(req.body.orderId), req.dbUser!.id);
  return sendSuccess(res, payment, "Payment order created", 201);
});

export const verifyPayment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const order = await paymentService.verifyPayment(req.body);
  return sendSuccess(res, order, "Payment verified");
});
