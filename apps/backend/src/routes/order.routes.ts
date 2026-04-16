import { Router } from "express";
import * as orderController from "../controllers/order.controller.js";
import { requireAdmin } from "../middlewares/require-admin.js";
import { requireDbUser } from "../middlewares/require-db-user.js";
import { validate } from "../middlewares/validate.js";
import { idParamSchema } from "../validations/common.validation.js";
import { createOrderSchema, updateOrderStatusSchema } from "../validations/order.validation.js";

export const orderRouter = Router();

orderRouter.use(requireDbUser);
orderRouter.post("/", validate(createOrderSchema), orderController.createOrder);
orderRouter.get("/", orderController.getOrders);
orderRouter.get("/:id", validate(idParamSchema, "params"), orderController.getOrder);
orderRouter.patch("/:id/status", requireAdmin, validate(idParamSchema, "params"), validate(updateOrderStatusSchema), orderController.updateOrderStatus);
