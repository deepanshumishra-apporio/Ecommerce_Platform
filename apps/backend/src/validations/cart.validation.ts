import { z } from "zod";

export const cartItemSchema = z.object({
  productId: z.uuid(),
  quantity: z.number().int().positive(),
  size: z.string().optional(),
});

export const updateCartItemSchema = z.object({
  cartItemId: z.uuid(),
  quantity: z.number().int().positive(),
});

export const removeCartItemSchema = z.object({
  cartItemId: z.uuid(),
});
