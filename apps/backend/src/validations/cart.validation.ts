import { z } from "zod";

export const cartItemSchema = z.object({
  productId: z.uuid(),
  quantity: z.number().int().positive(),
});

export const removeCartItemSchema = z.object({
  productId: z.uuid(),
});
