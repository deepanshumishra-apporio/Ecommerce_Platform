import { Router } from "express";
import * as addressController from "../controllers/address.controller.js";
import { AuthMiddleware } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.js";
import { idParamSchema } from "../validations/common.validation.js";
import { createAddressSchema, updateAddressSchema } from "../validations/address.validation.js";

export const addressRouter = Router();

addressRouter.use(AuthMiddleware);
addressRouter.get("/", addressController.getMyAddresses);
addressRouter.post("/", validate(createAddressSchema), addressController.createMyAddress);
addressRouter.put("/:id", validate(idParamSchema, "params"), validate(updateAddressSchema), addressController.updateMyAddress);
addressRouter.delete("/:id", validate(idParamSchema, "params"), addressController.deleteMyAddress);
