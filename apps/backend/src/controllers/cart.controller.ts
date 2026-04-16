import type { Response } from "express";
import { asyncHandler } from "../lib/async-handler.js";
import * as cartService from "../services/cart.service.js";
import type { AuthenticatedRequest } from "../types/api.js";
import { sendSuccess } from "../utils/response.js";

export const getCart = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const cart = await cartService.getCart(req.dbUser!.id);
  return sendSuccess(res, cart, "Cart fetched");
});

export const addToCart = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const cart = await cartService.addToCart(req.dbUser!.id, req.body);
  return sendSuccess(res, cart, "Item added to cart");
});

export const updateCart = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const cart = await cartService.updateCartItem(req.dbUser!.id, req.body);
  return sendSuccess(res, cart, "Cart updated");
});

export const removeFromCart = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const cart = await cartService.removeCartItem(req.dbUser!.id, String(req.body.productId));
  return sendSuccess(res, cart, "Item removed from cart");
});
