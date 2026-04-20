import { Router } from "express";
import * as categoryController from "../controllers/category.controller.js";
import { AdminMiddleware } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.js";
import { idParamSchema } from "../validations/common.validation.js";
import { categorySchema } from "../validations/category.validation.js";

export const categoryRouter = Router();

categoryRouter.get("/", categoryController.listCategories);
categoryRouter.post("/", AdminMiddleware, validate(categorySchema), categoryController.createCategory);
categoryRouter.put("/:id", AdminMiddleware, validate(idParamSchema, "params"), validate(categorySchema), categoryController.updateCategory);
categoryRouter.delete("/:id", AdminMiddleware, validate(idParamSchema, "params"), categoryController.deleteCategory);
