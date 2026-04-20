import { Router } from "express";
import * as paymentController from "../controllers/payment.controller.js";
import { AuthMiddleware } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.js";
import { createPaymentSchema, verifyPaymentSchema } from "../validations/payment.validation.js";

export const paymentRouter = Router();

paymentRouter.use(AuthMiddleware);
paymentRouter.post("/create", validate(createPaymentSchema), paymentController.createPayment);
paymentRouter.post("/verify", validate(verifyPaymentSchema), paymentController.verifyPayment);
