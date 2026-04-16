import { z } from "zod";

export const createPaymentSchema = z.object({
  orderId: z.uuid(),
});

export const verifyPaymentSchema = z.object({
  orderId: z.uuid(),
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});
