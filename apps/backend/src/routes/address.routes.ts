import { Router } from "express";
import * as addressController from "../controllers/address.controller.js";
import { requireDbUser } from "../middlewares/require-db-user.js";
import { validate } from "../middlewares/validate.js";
import { idParamSchema } from "../validations/common.validation.js";
import { createAddressSchema, updateAddressSchema } from "../validations/address.validation.js";

export const addressRouter = Router();

addressRouter.use(requireDbUser);
addressRouter.get("/", addressController.getAddresses);
addressRouter.post("/", validate(createAddressSchema), addressController.createAddress);
addressRouter.put("/:id", validate(idParamSchema, "params"), validate(updateAddressSchema), addressController.updateAddress);
addressRouter.delete("/:id", validate(idParamSchema, "params"), addressController.deleteAddress);
