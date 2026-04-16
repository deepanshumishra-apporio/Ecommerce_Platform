import { Router } from "express";
import * as adminController from "../controllers/admin.controller.js";
import { requireAdmin } from "../middlewares/require-admin.js";
import { requireDbUser } from "../middlewares/require-db-user.js";

export const adminRouter = Router();

adminRouter.use(requireDbUser, requireAdmin);
adminRouter.get("/dashboard", adminController.getDashboard);
adminRouter.get("/orders", adminController.getOrders);
adminRouter.get("/users", adminController.getUsers);
adminRouter.patch("/orders/:id/status", adminController.updateOrderStatus);
