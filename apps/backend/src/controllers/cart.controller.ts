import type { Response } from "express";
import { asyncHandler } from "../lib/async-handler.js";
import * as cartService from "../services/cart.service.js";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import { sendSuccess } from "../utils/response.js";

export const getMyCart = asyncHandler(async (req: AuthRequest, res: Response) => {
  const cart = await cartService.getCart(req.userId!);
  return sendSuccess(res, cart, "Cart fetched");
});

export const addToMyCart = asyncHandler(async (req: AuthRequest, res: Response) => {
  const cart = await cartService.addToCart(req.userId!, {
    productId: req.body.productId,
    quantity: req.body.quantity,
    size: req.body.size,
  });
  return sendSuccess(res, cart, "Item added to cart");
});

export const updateMyCart = asyncHandler(async (req: AuthRequest, res: Response) => {
  const cart = await cartService.updateCartItem(req.userId!, {
    cartItemId: req.body.cartItemId,
    quantity: req.body.quantity,
  });
  return sendSuccess(res, cart, "Cart updated");
});

export const removeFromMyCart = asyncHandler(async (req: AuthRequest, res: Response) => {
  const cart = await cartService.removeCartItem(req.userId!, String(req.body.cartItemId));
  return sendSuccess(res, cart, "Item removed from cart");
});
