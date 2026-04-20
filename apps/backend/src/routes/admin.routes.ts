import { Router } from "express";
import * as adminController from "../controllers/admin.controller.js";
import { AdminMiddleware } from "../middlewares/auth.middleware.js";

export const adminRouter = Router();

adminRouter.use(AdminMiddleware);
adminRouter.get("/check", adminController.checkAdmin);
adminRouter.get("/dashboard", adminController.getAdminDashboard);
adminRouter.get("/orders", adminController.getAllOrders);
adminRouter.get("/users", adminController.getAllUsers);
adminRouter.patch("/orders/:id/status", adminController.adminUpdateOrderStatus);
