import { z } from "zod";

export const applyCouponSchema = z.object({
  code: z.string().min(1),
  totalAmount: z.number().nonnegative(),
});

export const createCouponSchema = z.object({
  code: z.string().min(1),
  description: z.string().optional(),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  discountValue: z.number().positive(),
  minOrderAmount: z.number().positive().optional(),
  maxDiscount: z.number().positive().optional(),
  isActive: z.boolean().optional(),
  expiresAt: z.string().datetime().optional(),
});
