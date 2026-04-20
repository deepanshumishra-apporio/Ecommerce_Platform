import { Router } from "express";
import * as orderController from "../controllers/order.controller.js";
import { AuthMiddleware } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.js";
import { idParamSchema } from "../validations/common.validation.js";
import { createOrderSchema } from "../validations/order.validation.js";

export const orderRouter = Router();

orderRouter.use(AuthMiddleware);
orderRouter.post("/", validate(createOrderSchema), orderController.createOrder);
orderRouter.get("/", orderController.getMyOrders);
orderRouter.get("/:id", validate(idParamSchema, "params"), orderController.getMyOrderById);
