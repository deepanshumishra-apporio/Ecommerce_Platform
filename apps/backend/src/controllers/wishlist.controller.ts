import type { Response } from "express";
import { asyncHandler } from "../lib/async-handler.js";
import * as wishlistService from "../services/wishlist.service.js";
import type { AuthenticatedRequest } from "../types/api.js";
import { sendSuccess } from "../utils/response.js";

export const getWishlist = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const wishlist = await wishlistService.getWishlist(req.dbUser!.id);
  return sendSuccess(res, wishlist, "Wishlist fetched");
});

export const addToWishlist = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const wishlist = await wishlistService.addToWishlist(req.dbUser!.id, String(req.body.productId));
  return sendSuccess(res, wishlist, "Item added to wishlist");
});

export const removeFromWishlist = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const wishlist = await wishlistService.removeFromWishlist(
      req.dbUser!.id,
      String(req.body.productId),
    );
    return sendSuccess(res, wishlist, "Item removed from wishlist");
  },
);
