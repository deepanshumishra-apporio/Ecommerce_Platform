import { Router } from "express";
import * as cartController from "../controllers/cart.controller.js";
import { requireDbUser } from "../middlewares/require-db-user.js";
import { validate } from "../middlewares/validate.js";
import { cartItemSchema, removeCartItemSchema } from "../validations/cart.validation.js";

export const cartRouter = Router();

cartRouter.use(requireDbUser);
cartRouter.get("/", cartController.getCart);
cartRouter.post("/add", validate(cartItemSchema), cartController.addToCart);
cartRouter.put("/update", validate(cartItemSchema), cartController.updateCart);
cartRouter.delete("/remove", validate(removeCartItemSchema), cartController.removeFromCart);
