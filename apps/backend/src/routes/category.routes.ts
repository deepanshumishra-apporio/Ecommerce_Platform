import { Router } from "express";
import * as categoryController from "../controllers/category.controller.js";
import { requireAdmin } from "../middlewares/require-admin.js";
import { requireDbUser } from "../middlewares/require-db-user.js";
import { validate } from "../middlewares/validate.js";
import { idParamSchema } from "../validations/common.validation.js";
import { categorySchema } from "../validations/category.validation.js";

export const categoryRouter = Router();

categoryRouter.get("/", categoryController.listCategories);
categoryRouter.post("/", requireDbUser, requireAdmin, validate(categorySchema), categoryController.createCategory);
categoryRouter.put("/:id", requireDbUser, requireAdmin, validate(idParamSchema, "params"), validate(categorySchema), categoryController.updateCategory);
categoryRouter.delete("/:id", requireDbUser, requireAdmin, validate(idParamSchema, "params"), categoryController.deleteCategory);
