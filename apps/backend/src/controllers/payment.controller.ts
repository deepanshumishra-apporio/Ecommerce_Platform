import type { Response } from "express";
import { asyncHandler } from "../lib/async-handler.js";
import * as paymentService from "../services/payment.service.js";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import { sendSuccess } from "../utils/response.js";

export const createPayment = asyncHandler(async (req: AuthRequest, res: Response) => {

  const payment = await paymentService.createPaymentOrder(
    String(req.body.orderId), 
    req.userId!
  );

  return sendSuccess(
    res, 
    payment, 
    "Payment order created", 
    201
  );
});

export const verifyPayment = asyncHandler(async (req: AuthRequest, res: Response) => {

  const order = await paymentService.verifyPayment(req.body);

  return sendSuccess(
    res, 
    order, 
    "Payment verified"
  );

});
