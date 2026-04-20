import type { Response } from "express";
import { asyncHandler } from "../lib/async-handler.js";
import * as wishlistService from "../services/wishlist.service.js";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import { sendSuccess } from "../utils/response.js";

export const getMyWishlist = asyncHandler(async (req: AuthRequest, res: Response) => {
  const wishlist = await wishlistService.getWishlist(req.userId!);
  return sendSuccess(res, wishlist, "Wishlist fetched");
});

export const addToMyWishlist = asyncHandler(async (req: AuthRequest, res: Response) => {
  const wishlist = await wishlistService.addToWishlist(req.userId!, String(req.body.productId));
  return sendSuccess(res, wishlist, "Item added to wishlist");
});

export const removeFromMyWishlist = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const wishlist = await wishlistService.removeFromWishlist(
      req.userId!,
      String(req.body.productId),
    );
    return sendSuccess(res, wishlist, "Item removed from wishlist");
  },
);
