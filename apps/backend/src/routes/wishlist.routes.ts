import { Router } from "express";
import * as wishlistController from "../controllers/wishlist.controller.js";
import { AuthMiddleware } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.js";
import { wishlistItemSchema } from "../validations/wishlist.validation.js";

export const wishlistRouter = Router();

wishlistRouter.use(AuthMiddleware);
wishlistRouter.get("/", wishlistController.getMyWishlist);
wishlistRouter.post("/add", validate(wishlistItemSchema), wishlistController.addToMyWishlist);
wishlistRouter.delete("/remove", validate(wishlistItemSchema), wishlistController.removeFromMyWishlist);
