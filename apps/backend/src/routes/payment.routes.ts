import { Router } from "express";
import * as paymentController from "../controllers/payment.controller.js";
import { requireDbUser } from "../middlewares/require-db-user.js";
import { validate } from "../middlewares/validate.js";
import { createPaymentSchema, verifyPaymentSchema } from "../validations/payment.validation.js";

export const paymentRouter = Router();

paymentRouter.use(requireDbUser);
paymentRouter.post("/create", validate(createPaymentSchema), paymentController.createPayment);
paymentRouter.post("/verify", validate(verifyPaymentSchema), paymentController.verifyPayment);
