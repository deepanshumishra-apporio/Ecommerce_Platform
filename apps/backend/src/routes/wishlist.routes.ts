import { Router } from "express";
import * as wishlistController from "../controllers/wishlist.controller.js";
import { requireDbUser } from "../middlewares/require-db-user.js";
import { validate } from "../middlewares/validate.js";
import { wishlistItemSchema } from "../validations/wishlist.validation.js";

export const wishlistRouter = Router();

wishlistRouter.use(requireDbUser);
wishlistRouter.get("/", wishlistController.getWishlist);
wishlistRouter.post("/add", validate(wishlistItemSchema), wishlistController.addToWishlist);
wishlistRouter.delete("/remove", validate(wishlistItemSchema), wishlistController.removeFromWishlist);
