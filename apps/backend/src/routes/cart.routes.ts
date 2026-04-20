import { Router } from "express";
import * as cartController from "../controllers/cart.controller.js";
import { AuthMiddleware } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.js";
import { cartItemSchema, updateCartItemSchema, removeCartItemSchema } from "../validations/cart.validation.js";

export const cartRouter = Router();

cartRouter.use(AuthMiddleware);
cartRouter.get("/", cartController.getMyCart);
cartRouter.post("/add", validate(cartItemSchema), cartController.addToMyCart);
cartRouter.put("/update", validate(updateCartItemSchema), cartController.updateMyCart);
cartRouter.delete("/remove", validate(removeCartItemSchema), cartController.removeFromMyCart);
